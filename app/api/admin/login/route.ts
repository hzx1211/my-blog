import { NextResponse } from "next/server";
import {
  adminCookieName,
  createAdminSession,
  isAdminPasswordConfigured,
  isSecureCookie,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { message: "后台尚未完成安全配置" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { password?: unknown };
    const session = createAdminSession(typeof body.password === "string" ? body.password : "");

    if (!session) {
      return NextResponse.json({ message: "管理员密码错误" }, { status: 401 });
    }

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set({
      name: adminCookieName,
      value: session,
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureCookie(request),
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ message: "请求格式无效" }, { status: 400 });
  }
}
