import { NextResponse } from "next/server";
import { readMusicTracks } from "@/lib/server/music";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { items: readMusicTracks() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
