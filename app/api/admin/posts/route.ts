import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  createPost,
  PostValidationError,
  readPosts,
  writePosts,
} from "@/lib/server/posts";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

function badRequest(error: unknown) {
  if (error instanceof PostValidationError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "请求格式无效" }, { status: 400 });
}

export async function GET() {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  return NextResponse.json({ items: readPosts() });
}

export async function POST(request: Request) {
  if (!hasAdminSession()) {
    return unauthorized();
  }

  try {
    const posts = readPosts();
    const post = createPost(await request.json(), posts);
    writePosts([post, ...posts]);
    return NextResponse.json({ item: post }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
