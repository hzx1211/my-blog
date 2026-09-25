import { NextResponse } from "next/server";
import { getPostBySlug, toPublicPost } from "@/lib/server/posts";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const post = await getPostBySlug(params.slug, true);

  if (!post) {
    return NextResponse.json({ message: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json({ item: { ...toPublicPost(post), content: post.content } });
}
