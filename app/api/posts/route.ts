import { NextResponse } from "next/server";
import { listPosts, toPublicPost } from "@/lib/server/posts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 12)));
  const publishedPosts = listPosts({ publishedOnly: true }).filter(
    (post) => !category || post.category === category,
  );
  const start = (page - 1) * pageSize;

  return NextResponse.json({
    items: publishedPosts.slice(start, start + pageSize).map(toPublicPost),
    total: publishedPosts.length,
    page,
    pageSize,
  });
}
