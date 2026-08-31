import { NextResponse } from "next/server";
import { incrementPostViews } from "@/lib/server/posts";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const views = incrementPostViews(params.slug);

  if (views === null) {
    return NextResponse.json({ message: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json(
    { views },
    { headers: { "Cache-Control": "no-store" } },
  );
}
