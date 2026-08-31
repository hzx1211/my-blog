import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UploadDescriptor = {
  type: "image" | "video";
  extension: string;
  maxBytes: number;
};

const uploadTypes: Record<string, UploadDescriptor> = {
  "image/jpeg": { type: "image", extension: "jpg", maxBytes: 20 * 1024 * 1024 },
  "image/png": { type: "image", extension: "png", maxBytes: 20 * 1024 * 1024 },
  "image/webp": { type: "image", extension: "webp", maxBytes: 20 * 1024 * 1024 },
  "image/gif": { type: "image", extension: "gif", maxBytes: 20 * 1024 * 1024 },
  "video/mp4": { type: "video", extension: "mp4", maxBytes: 120 * 1024 * 1024 },
  "video/webm": { type: "video", extension: "webm", maxBytes: 120 * 1024 * 1024 },
  "video/quicktime": { type: "video", extension: "mov", maxBytes: 120 * 1024 * 1024 },
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

  return name || (type === "image" ? "博客照片" : "我的 Vlog");
}

export async function POST(request: Request) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  try {
    const formData = await request.formData();
    const entry = formData.get("file");
    if (!entry || typeof entry === "string") {
      return NextResponse.json({ message: "请选择要上传的照片或视频" }, { status: 400 });
    }

    const descriptor = uploadTypes[entry.type];
    if (!descriptor) {
      return NextResponse.json(
        { message: "仅支持 JPG、PNG、WebP、GIF、MP4、WebM 或 MOV 文件" },
        { status: 400 },
      );
    }
    if (entry.size === 0) {
      return NextResponse.json({ message: "上传文件为空" }, { status: 400 });
    }
    if (entry.size > descriptor.maxBytes) {
      const limit = Math.floor(descriptor.maxBytes / 1024 / 1024);
      return NextResponse.json(
        { message: `${descriptor.type === "image" ? "照片" : "视频"}不能超过 ${limit}MB` },
        { status: 413 },
      );
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });

    const fileName = `${Date.now()}-${randomUUID()}.${descriptor.extension}`;
    await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await entry.arrayBuffer()));

    return NextResponse.json(
      {
        item: {
          type: descriptor.type,
          url: `/api/media/${fileName}`,
          alt: fileLabel(entry.name, descriptor.type),
          caption: "",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Media upload failed", error);
    return NextResponse.json({ message: "上传失败，请稍后重试" }, { status: 500 });
  }
}
