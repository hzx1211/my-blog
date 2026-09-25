import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  createPost,
  PostValidationError,
  readPosts,
  writePosts,
} from "@/lib/server/posts";
import { PersistentStorageUnavailableError } from "@/lib/server/persistence";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

function badRequest(error: unknown) {
  if (error instanceof PostValidationError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (error instanceof PersistentStorageUnavailableError) {
    return NextResponse.json({ message: error.message }, { status: 503 });
  }

  console.error("Article save failed", error);
  return NextResponse.json({ message: "文章保存失败，请检查内容后重试" }, { status: 500 });
}

export async function GET() {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  try {
    return NextResponse.json({ items: await readPosts() });
  } catch (error) {
    return badRequest(error);
  }
}

export async function POST(request: Request) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  try {
    const posts = await readPosts();
    const post = createPost(await request.json(), posts);
    await writePosts([post, ...posts]);
    return NextResponse.json({ item: post }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
