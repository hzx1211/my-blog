import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  createMediaUploadTicket,
  isSupabaseConfigured,
  mediaBucket,
  PersistentStorageUnavailableError,
  uploadMediaObject,
} from "@/lib/server/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UploadDescriptor = {
  type: "image" | "video" | "audio";
  extension: string;
  maxBytes: number;
};

const uploadTypes: Record<string, UploadDescriptor> = {
  "image/jpeg": { type: "image", extension: "jpg", maxBytes: 20 * 1024 * 1024 },
  "image/png": { type: "image", extension: "png", maxBytes: 20 * 1024 * 1024 },
  "image/webp": { type: "image", extension: "webp", maxBytes: 20 * 1024 * 1024 },
  "image/gif": { type: "image", extension: "gif", maxBytes: 20 * 1024 * 1024 },
  "video/mp4": { type: "video", extension: "mp4", maxBytes: 50 * 1024 * 1024 },
  "video/webm": { type: "video", extension: "webm", maxBytes: 50 * 1024 * 1024 },
  "video/quicktime": { type: "video", extension: "mov", maxBytes: 50 * 1024 * 1024 },
  "audio/aac": { type: "audio", extension: "aac", maxBytes: 40 * 1024 * 1024 },
  "audio/m4a": { type: "audio", extension: "m4a", maxBytes: 40 * 1024 * 1024 },
  "audio/mp3": { type: "audio", extension: "mp3", maxBytes: 40 * 1024 * 1024 },
  "audio/mp4": { type: "audio", extension: "m4a", maxBytes: 40 * 1024 * 1024 },
  "audio/mpeg": { type: "audio", extension: "mp3", maxBytes: 40 * 1024 * 1024 },
  "audio/ogg": { type: "audio", extension: "ogg", maxBytes: 40 * 1024 * 1024 },
  "audio/wav": { type: "audio", extension: "wav", maxBytes: 40 * 1024 * 1024 },
  "audio/wave": { type: "audio", extension: "wav", maxBytes: 40 * 1024 * 1024 },
  "audio/x-m4a": { type: "audio", extension: "m4a", maxBytes: 40 * 1024 * 1024 },
  "audio/x-wav": { type: "audio", extension: "wav", maxBytes: 40 * 1024 * 1024 },
};

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

function fileLabel(fileName: string, type: UploadDescriptor["type"]) {
  const name = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim()
    .slice(0, 120);

  return name || (type === "image" ? "博客照片" : type === "video" ? "我的 Vlog" : "音乐文件");
}

export async function POST(request: Request) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      const name = typeof body.name === "string" ? body.name : "";
      const type = typeof body.type === "string" ? body.type.toLowerCase() : "";
      const size = Number(body.size);
      const descriptor = uploadTypes[type];

      if (!descriptor) {
        return NextResponse.json({ message: "不支持的媒体格式" }, { status: 400 });
      }
      if (!Number.isFinite(size) || size <= 0) {
        return NextResponse.json({ message: "上传文件大小无效" }, { status: 400 });
      }
      if (size > descriptor.maxBytes) {
        const limit = Math.floor(descriptor.maxBytes / 1024 / 1024);
        return NextResponse.json(
          { message: `${descriptor.type === "video" ? "Vlog" : descriptor.type === "audio" ? "音乐" : "照片"}不能超过 ${limit}MB` },
          { status: 413 },
        );
      }
      if (!isSupabaseConfigured()) {
        return NextResponse.json(
          { message: "线上媒体存储尚未连接，请先配置 Supabase Storage。" },
          { status: 503 },
        );
      }

      const fileName = `${Date.now()}-${randomUUID()}.${descriptor.extension}`;
      const ticket = await createMediaUploadTicket(fileName);
      return NextResponse.json({
        upload: { bucket: mediaBucket, path: ticket.path, token: ticket.token },
        item: {
          type: descriptor.type,
          url: ticket.publicUrl,
          alt: fileLabel(name, descriptor.type),
          caption: "",
        },
      });
    }

    if (process.env.VERCEL === "1") {
      return NextResponse.json(
        { message: "线上上传需启用浏览器直传，请配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。" },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const entry = formData.get("file");
    if (!entry || typeof entry === "string") {
      return NextResponse.json({ message: "请选择要上传的照片或视频" }, { status: 400 });
    }

    const descriptor = uploadTypes[entry.type];
    if (!descriptor) {
      return NextResponse.json(
        { message: "仅支持图片、视频或音频格式" },
        { status: 400 },
      );
    }
    if (entry.size === 0) {
      return NextResponse.json({ message: "上传文件为空" }, { status: 400 });
    }
    if (entry.size > descriptor.maxBytes) {
      const limit = Math.floor(descriptor.maxBytes / 1024 / 1024);
      return NextResponse.json(
        { message: `${descriptor.type === "image" ? "照片" : descriptor.type === "video" ? "Vlog" : "音乐"}不能超过 ${limit}MB` },
        { status: 413 },
      );
    }

    const fileName = `${Date.now()}-${randomUUID()}.${descriptor.extension}`;
    let mediaUrl: string;
    if (isSupabaseConfigured()) {
      mediaUrl = await uploadMediaObject(fileName, new Uint8Array(await entry.arrayBuffer()), entry.type);
    } else {
      const uploadDirectory = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await entry.arrayBuffer()));
      mediaUrl = `/api/media/${fileName}`;
    }

    return NextResponse.json(
      {
        item: {
          type: descriptor.type,
          url: mediaUrl,
          alt: fileLabel(entry.name, descriptor.type),
          caption: "",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Media upload failed", error);
    if (error instanceof PersistentStorageUnavailableError) {
      return NextResponse.json({ message: error.message }, { status: 503 });
    }
    return NextResponse.json({ message: "上传失败，请稍后重试" }, { status: 500 });
  }
}
