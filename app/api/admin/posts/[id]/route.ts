import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  getPostById,
  PostValidationError,
  readPosts,
  updatePost,
  writePosts,
} from "@/lib/server/posts";
import { PersistentStorageUnavailableError } from "@/lib/server/persistence";

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

  const existing = await getPostById(params.id);
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

  let posts;
  let existing;
  try {
    posts = await readPosts();
    existing = posts.find((post) => post.id === params.id) ?? null;
  } catch (error) {
    console.error("Article data could not be read", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "文章暂时无法读取" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }

  if (!existing) {
    return NextResponse.json({ message: "文章不存在" }, { status: 404 });
  }

  try {
    const updated = updatePost(existing, await request.json(), posts);
    await writePosts(posts.map((post) => (post.id === existing.id ? updated : post)));
    return NextResponse.json({ item: updated });
  } catch (error) {
    if (error instanceof PostValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof PersistentStorageUnavailableError) {
      return NextResponse.json({ message: error.message }, { status: 503 });
    }

    console.error("Article update failed", error);
    return NextResponse.json({ message: "文章保存失败，请稍后重试" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  let posts;
  try {
    posts = await readPosts();
  } catch (error) {
    console.error("Article data could not be read", error);
    return NextResponse.json({ message: "文章暂时无法读取" }, { status: 503 });
  }
  const existing = posts.find((post) => post.id === params.id);

  if (!existing) {
    return NextResponse.json({ message: "文章不存在" }, { status: 404 });
  }

  try {
    await writePosts(posts.filter((post) => post.id !== params.id));
  } catch (error) {
    console.error("Article delete failed", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "文章删除失败" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
  return NextResponse.json({ deleted: true });
}
