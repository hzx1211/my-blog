import { NextResponse } from "next/server";
import { hasAdminSession, isAdminPasswordConfigured } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    authenticated: isAdminPasswordConfigured() && hasAdminSession(),
    configured: isAdminPasswordConfigured(),
  });
}
