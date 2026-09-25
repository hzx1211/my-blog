import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { createMusicTrack, readMusicTracks, writeMusicTracks } from "@/lib/server/music";
import { PersistentStorageUnavailableError } from "@/lib/server/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET() {
  if (!hasAdminSession()) return unauthorized();

  try {
    return NextResponse.json(
      { items: await readMusicTracks() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Music list could not be read", error);
    return NextResponse.json({ message: "音乐列表暂时无法读取" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!hasAdminSession()) return unauthorized();

  try {
    const input = await request.json();
    const track = createMusicTrack(input);
    const tracks = await readMusicTracks();
    await writeMusicTracks([track, ...tracks]);
    return NextResponse.json({ item: track }, { status: 201 });
  } catch (error) {
    if (error instanceof PersistentStorageUnavailableError) {
      return NextResponse.json({ message: error.message }, { status: 503 });
    }
    if (error instanceof SyntaxError || error instanceof Error) {
      return NextResponse.json(
        { message: error instanceof SyntaxError ? "请求内容不是有效 JSON" : error.message || "音乐信息无效" },
        { status: 400 },
      );
    }
    console.error("Music metadata save failed", error);
    return NextResponse.json({ message: "音乐信息保存失败" }, { status: 500 });
  }
}
