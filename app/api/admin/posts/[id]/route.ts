import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  getPostById,
  PostValidationError,
  readPosts,
  updatePost,
  writePosts,
} from "@/lib/server/posts";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  const existing = getPostById(params.id);
  if (!existing) {
    return NextResponse.json({ message: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json({ item: existing }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  const posts = readPosts();
  const existing = getPostById(params.id);

  if (!existing) {
    return NextResponse.json({ message: "文章不存在" }, { status: 404 });
  }

  try {
    const updated = updatePost(existing, await request.json(), posts);
    writePosts(posts.map((post) => (post.id === existing.id ? updated : post)));
    return NextResponse.json({ item: updated });
  } catch (error) {
    if (error instanceof PostValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "请求格式无效" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  const posts = readPosts();
  const existing = posts.find((post) => post.id === params.id);

  if (!existing) {
    return NextResponse.json({ message: "文章不存在" }, { status: 404 });
  }

  writePosts(posts.filter((post) => post.id !== params.id));
  return NextResponse.json({ deleted: true });
}
