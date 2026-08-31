import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  ".aac": "audio/aac",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".m4a": "audio/mp4",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: { filename: string } },
) {
  const filename = params.filename;
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ message: "媒体不存在" }, { status: 404 });
  }

  const extension = path.extname(filename).toLowerCase();
  const contentType = contentTypes[extension];
  if (!contentType) {
    return NextResponse.json({ message: "媒体不存在" }, { status: 404 });
  }

  try {
    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    const content = await readFile(path.join(uploadDirectory, filename));
    return new NextResponse(content, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ message: "媒体不存在" }, { status: 404 });
  }
}
