"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UploadedMedia = {
  type: "image" | "video" | "audio";
  url: string;
  alt: string;
  caption: string;
};

type SignedUploadResponse = {
  upload: { bucket: string; path: string; token: string };
  item: UploadedMedia;
  message?: string;
};

let browserClient: SupabaseClient | null = null;

function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return browserClient;
}

async function responseMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || `上传失败（${response.status}）`;
}

/** Uploads directly to Supabase in production, avoiding Vercel's function body limit. */
export async function uploadAdminMedia(file: File): Promise<UploadedMedia> {
  const client = getBrowserSupabase();

  if (client) {
    const ticketResponse = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
    });
    if (!ticketResponse.ok) throw new Error(await responseMessage(ticketResponse));

    const ticket = (await ticketResponse.json()) as SignedUploadResponse;
    const { error } = await client.storage
      .from(ticket.upload.bucket)
      .uploadToSignedUrl(ticket.upload.path, ticket.upload.token, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) throw new Error(`文件上传失败：${error.message}`);
    return ticket.item;
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
  if (!response.ok) throw new Error(await responseMessage(response));

  const result = (await response.json()) as { item?: UploadedMedia; message?: string };
  if (!result.item) throw new Error(result.message || "上传结果无效");
  return result.item;
}
