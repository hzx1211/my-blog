import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  JourneyHomeValidationError,
  clearJourneyHome,
  readJourneyHome,
  saveJourneyHome,
} from "@/lib/server/journey-home";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET() {
  if (!hasAdminSession()) return unauthorized();
  return NextResponse.json({ item: readJourneyHome() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!hasAdminSession()) return unauthorized();

  try {
    return NextResponse.json({ item: saveJourneyHome(await request.json()) });
  } catch (error) {
    if (error instanceof JourneyHomeValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "家的位置保存失败" }, { status: 400 });
  }
}

export async function DELETE() {
  if (!hasAdminSession()) return unauthorized();
  clearJourneyHome();
  return NextResponse.json({ deleted: true });
}
