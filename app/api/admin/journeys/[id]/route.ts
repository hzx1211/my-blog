import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  JourneyValidationError,
  readJourneys,
  updateJourney,
  writeJourneys,
} from "@/lib/server/journeys";
import { PersistentStorageUnavailableError } from "@/lib/server/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasAdminSession()) return unauthorized();

  let items;
  try {
    items = await readJourneys();
  } catch (error) {
    console.error("Journey list could not be read", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "旅行记录暂时无法读取" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
  const existing = items.find((item) => item.id === params.id);
  if (!existing) {
    return NextResponse.json({ message: "旅行记忆不存在" }, { status: 404 });
  }

  try {
    const updated = updateJourney(existing, await request.json());
    await writeJourneys(items.map((item) => item.id === existing.id ? updated : item));
    return NextResponse.json({ item: updated });
  } catch (error) {
    if (error instanceof JourneyValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Journey update failed", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "旅行记忆保存失败" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasAdminSession()) return unauthorized();

  let items;
  try {
    items = await readJourneys();
  } catch (error) {
    console.error("Journey list could not be read", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "旅行记录暂时无法读取" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
  const existing = items.find((item) => item.id === params.id);
  if (!existing) {
    return NextResponse.json({ message: "旅行记忆不存在" }, { status: 404 });
  }

  try {
    await writeJourneys(items.filter((item) => item.id !== existing.id));
  } catch (error) {
    console.error("Journey delete failed", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "旅行记忆删除失败" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
  return NextResponse.json({ deleted: true });
}
