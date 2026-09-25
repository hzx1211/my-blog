import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const contentTable = "blog_content";
export const mediaBucket = "blog-media";

export class PersistentStorageUnavailableError extends Error {
  constructor(message = "线上内容存储暂不可用，请检查 Supabase 配置。") {
    super(message);
    this.name = "PersistentStorageUnavailableError";
  }
}

type ContentRow = {
  id: string;
  payload: unknown;
  updated_at: string;
};

let cachedAdminClient: SupabaseClient | null = null;

function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function serviceKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function adminKeyErrorMessage() {
  if (serviceKey().startsWith("sb_publishable_")) {
    return "Supabase 配置错误：Vercel 的 SUPABASE_SECRET_KEY 当前是公开的 sb_publishable_ key。请替换为 Supabase 的 sb_secret_ key（或旧版 service_role key）后重新部署。";
  }
  return "线上数据库尚未配置：请设置 SUPABASE_URL 和 SUPABASE_SECRET_KEY。";
}

function isProductionRuntime() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function isSupabaseConfigured() {
  const apiKey = serviceKey();
  return Boolean(supabaseUrl() && apiKey && !apiKey.startsWith("sb_publishable_"));
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new PersistentStorageUnavailableError(adminKeyErrorMessage());
  }

  if (!cachedAdminClient) {
    const apiKey = serviceKey();
    cachedAdminClient = createClient(supabaseUrl(), apiKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }

  return cachedAdminClient;
}

function localFilePath(fileName: string) {
  return path.join(process.cwd(), "data", fileName);
}

async function readLocalJson<T>(fileName: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(localFilePath(fileName), "utf8")) as T;
  } catch {
    return fallback;
  }
}

type ContentQueryResult = { error: { code?: string; message?: string } | null };

async function runContentQuery<T extends ContentQueryResult>(query: () => PromiseLike<T>): Promise<T> {
  let result = await query();
  // PostgREST can briefly reject the gateway's freshly issued service JWT.
  // Retry only that transient authentication error; all other errors surface.
  for (const delay of [1000, 2000]) {
    if (result.error?.code !== "PGRST303" || result.error.message !== "JWT issued at future") break;
    await new Promise((resolve) => setTimeout(resolve, delay));
    result = await query();
  }
  return result;
}

/**
 * Uses Postgres on Vercel/when configured locally; local development without
 * Supabase continues to use the checked-in JSON seed files.
 */
export async function readContent<T>(key: string, fileName: string, fallback: T): Promise<T> {
  if (isSupabaseConfigured()) {
    const { data, error } = await runContentQuery(() =>
      getSupabaseAdmin().from(contentTable).select("payload").eq("id", key).maybeSingle(),
    );

    if (error) {
      console.error(`Supabase read failed for ${key}`, error);
      throw new PersistentStorageUnavailableError();
    }

    if (data?.payload !== undefined) return data.payload as T;
    if (isProductionRuntime()) {
      console.error(`Supabase content row missing for ${key}`);
      throw new PersistentStorageUnavailableError("线上内容记录缺失，请检查 Supabase 数据导入。");
    }
  } else if (isProductionRuntime()) {
    throw new PersistentStorageUnavailableError(adminKeyErrorMessage());
  }

  return readLocalJson(fileName, fallback);
}

export async function writeContent<T>(key: string, fileName: string, payload: T): Promise<void> {
  if (isSupabaseConfigured()) {
    const row = { id: key, payload, updated_at: new Date().toISOString() } satisfies ContentRow;
    const { error } = await runContentQuery(() =>
      getSupabaseAdmin().from(contentTable).upsert(row, { onConflict: "id" }),
    );

    if (error) {
      console.error(`Supabase write failed for ${key}`, error);
      throw new PersistentStorageUnavailableError();
    }
    return;
  }

  if (isProductionRuntime()) {
    throw new PersistentStorageUnavailableError(`${adminKeyErrorMessage()} 修改没有保存。`);
  }

  const filePath = localFilePath(fileName);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function isSupabasePublicMediaUrl(value: string) {
  const base = supabaseUrl();
  if (!base) return false;

  try {
    const expected = new URL(base);
    const candidate = new URL(value);
    return (
      candidate.protocol === "https:" &&
      candidate.origin === expected.origin &&
      candidate.pathname.startsWith(`/storage/v1/object/public/${mediaBucket}/`) &&
      !candidate.search &&
      !candidate.hash
    );
  } catch {
    return false;
  }
}

export async function createMediaUploadTicket(objectPath: string) {
  const client = getSupabaseAdmin();
  const storage = client.storage.from(mediaBucket);
  const { data, error } = await storage.createSignedUploadUrl(objectPath, { upsert: false });
  if (error) {
    console.error("Supabase signed upload URL creation failed", error);
    throw new PersistentStorageUnavailableError("媒体存储暂不可用，请检查 Supabase Storage 配置。");
  }

  return {
    path: data.path,
    token: data.token,
    publicUrl: storage.getPublicUrl(data.path).data.publicUrl,
  };
}

export async function uploadMediaObject(objectPath: string, bytes: Uint8Array, contentType: string) {
  const storage = getSupabaseAdmin().storage.from(mediaBucket);
  const { error } = await storage.upload(objectPath, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("Supabase media upload failed", error);
    throw new PersistentStorageUnavailableError("媒体上传失败，请检查 Supabase Storage 配置和文件大小限制。");
  }

  return storage.getPublicUrl(objectPath).data.publicUrl;
}

export async function deleteSupabaseMedia(value: string) {
  if (!isSupabasePublicMediaUrl(value)) return;

  const expectedPrefix = `/storage/v1/object/public/${mediaBucket}/`;
  let objectPath: string;
  try {
    objectPath = decodeURIComponent(new URL(value).pathname.slice(expectedPrefix.length));
  } catch {
    return;
  }
  if (!objectPath) return;

  const { error } = await getSupabaseAdmin().storage.from(mediaBucket).remove([objectPath]);
  if (error) {
    console.error("Supabase media cleanup failed", error);
    throw new PersistentStorageUnavailableError("媒体文件删除失败，请稍后重试。");
  }
}

