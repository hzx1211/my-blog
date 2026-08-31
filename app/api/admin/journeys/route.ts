import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  createJourney,
  JourneyValidationError,
  readJourneys,
  writeJourneys,
} from "@/lib/server/journeys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET() {
  if (!hasAdminSession()) return unauthorized();
  return NextResponse.json({ items: readJourneys() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!hasAdminSession()) return unauthorized();

  try {
    const memory = createJourney(await request.json());
    const items = readJourneys();
    writeJourneys([memory, ...items]);
    return NextResponse.json({ item: memory }, { status: 201 });
  } catch (error) {
    if (error instanceof JourneyValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "旅行记忆保存失败" }, { status: 400 });
  }
}
