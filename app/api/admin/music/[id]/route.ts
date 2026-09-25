import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { mediaFileName, readMusicTracks, writeMusicTracks } from "@/lib/server/music";
import { deleteSupabaseMedia } from "@/lib/server/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  const tracks = await readMusicTracks();
  const track = tracks.find((item) => item.id === params.id);
  if (!track) {
    return NextResponse.json({ message: "曲目不存在" }, { status: 404 });
  }

  await writeMusicTracks(tracks.filter((item) => item.id !== track.id));

  const fileName = mediaFileName(track.url);
  if (fileName) {
    const filePath = path.join(process.cwd(), "public", "uploads", fileName);
    await unlink(filePath).catch(() => undefined);
  }

  if (track.url.startsWith("https://")) {
    await deleteSupabaseMedia(track.url).catch((error) => {
      console.error("Music object cleanup failed after deleting its track", error);
    });
  }

  return NextResponse.json({ deleted: true });
}
