import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  createJourney,
  JourneyValidationError,
  readJourneys,
  writeJourneys,
} from "@/lib/server/journeys";
import { PersistentStorageUnavailableError } from "@/lib/server/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET() {
  if (!hasAdminSession()) return unauthorized();
  try {
    return NextResponse.json({ items: await readJourneys() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Journey list could not be read", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "旅行记录暂时无法读取" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!hasAdminSession()) return unauthorized();

  try {
    const memory = createJourney(await request.json());
    const items = await readJourneys();
    await writeJourneys([memory, ...items]);
    return NextResponse.json({ item: memory }, { status: 201 });
  } catch (error) {
    if (error instanceof JourneyValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Journey save failed", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "旅行记忆保存失败" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}
