import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  JourneyHomeValidationError,
  clearJourneyHome,
  readJourneyHome,
  saveJourneyHome,
} from "@/lib/server/journey-home";
import { PersistentStorageUnavailableError } from "@/lib/server/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET() {
  if (!hasAdminSession()) return unauthorized();
  try {
    return NextResponse.json({ item: await readJourneyHome() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Journey home could not be read", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "家的位置暂时无法读取" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession()) return unauthorized();

  try {
    return NextResponse.json({ item: await saveJourneyHome(await request.json()) });
  } catch (error) {
    if (error instanceof JourneyHomeValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Journey home save failed", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "家的位置保存失败" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}

export async function DELETE() {
  if (!hasAdminSession()) return unauthorized();
  try {
    await clearJourneyHome();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Journey home delete failed", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "家的位置删除失败" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}
