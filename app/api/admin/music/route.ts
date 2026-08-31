import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { createMusicTrack, readMusicTracks, writeMusicTracks } from "@/lib/server/music";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AudioDescriptor = {
  extension: string;
  maxBytes: number;
};

const maxAudioBytes = 40 * 1024 * 1024;

const audioTypes: Record<string, AudioDescriptor> = {
  "audio/aac": { extension: "aac", maxBytes: maxAudioBytes },
  "audio/m4a": { extension: "m4a", maxBytes: maxAudioBytes },
  "audio/mp3": { extension: "mp3", maxBytes: maxAudioBytes },
  "audio/mp4": { extension: "m4a", maxBytes: maxAudioBytes },
  "audio/mpeg": { extension: "mp3", maxBytes: maxAudioBytes },
  "audio/ogg": { extension: "ogg", maxBytes: maxAudioBytes },
  "audio/wav": { extension: "wav", maxBytes: maxAudioBytes },
  "audio/wave": { extension: "wav", maxBytes: maxAudioBytes },
  "audio/x-m4a": { extension: "m4a", maxBytes: maxAudioBytes },
  "audio/x-wav": { extension: "wav", maxBytes: maxAudioBytes },
};

const extensionTypes: Record<string, AudioDescriptor> = {
  ".aac": audioTypes["audio/aac"],
  ".m4a": audioTypes["audio/m4a"],
  ".mp3": audioTypes["audio/mp3"],
  ".ogg": audioTypes["audio/ogg"],
  ".wav": audioTypes["audio/wav"],
};

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

function asText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function trackTitleFromFileName(fileName: string) {
  const title = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim()
    .slice(0, 100);

  return title || "未命名曲目";
}

function descriptorFor(file: File) {
  const fromType = audioTypes[file.type.toLowerCase()];
  if (fromType) return fromType;

  return extensionTypes[path.extname(file.name).toLowerCase()] ?? null;
}

export async function GET() {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  return NextResponse.json(
    { items: readMusicTracks() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  let storedFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const entry = formData.get("file");
    if (!entry || typeof entry === "string") {
      return NextResponse.json({ message: "请选择要上传的音乐文件" }, { status: 400 });
    }

    const descriptor = descriptorFor(entry);
    if (!descriptor) {
      return NextResponse.json(
        { message: "仅支持 MP3、M4A、WAV、OGG 或 AAC 音频" },
        { status: 400 },
      );
    }
    if (entry.size === 0) {
      return NextResponse.json({ message: "上传文件为空" }, { status: 400 });
    }
    if (entry.size > descriptor.maxBytes) {
      return NextResponse.json({ message: "音乐文件不能超过 40MB" }, { status: 413 });
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });

    const fileName = `${Date.now()}-${randomUUID()}.${descriptor.extension}`;
    const url = `/api/media/${fileName}`;
    const track = createMusicTrack({
      title: asText(formData.get("title")) || trackTitleFromFileName(entry.name),
      artist: asText(formData.get("artist")),
      url,
    });

    storedFilePath = path.join(uploadDirectory, fileName);
    await writeFile(storedFilePath, Buffer.from(await entry.arrayBuffer()));

    const tracks = readMusicTracks();
    writeMusicTracks([track, ...tracks]);

    return NextResponse.json({ item: track }, { status: 201 });
  } catch (error) {
    if (storedFilePath) {
      await unlink(storedFilePath).catch(() => undefined);
    }
    console.error("Music upload failed", error);
    return NextResponse.json({ message: "音乐上传失败，请稍后重试" }, { status: 500 });
  }
}
