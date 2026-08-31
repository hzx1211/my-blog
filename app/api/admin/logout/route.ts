import { NextResponse } from "next/server";
import { adminCookieName, isSecureCookie } from "@/lib/server/auth";

export async function POST(request: Request) {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: adminCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(request),
    maxAge: 0,
    path: "/",
  });
  return response;
}
