import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  JourneyValidationError,
  readJourneys,
  updateJourney,
  writeJourneys,
} from "@/lib/server/journeys";

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

  const items = readJourneys();
  const existing = items.find((item) => item.id === params.id);
  if (!existing) {
    return NextResponse.json({ message: "旅行记忆不存在" }, { status: 404 });
  }

  try {
    const updated = updateJourney(existing, await request.json());
    writeJourneys(items.map((item) => item.id === existing.id ? updated : item));
    return NextResponse.json({ item: updated });
  } catch (error) {
    if (error instanceof JourneyValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "旅行记忆保存失败" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasAdminSession()) return unauthorized();

  const items = readJourneys();
  const existing = items.find((item) => item.id === params.id);
  if (!existing) {
    return NextResponse.json({ message: "旅行记忆不存在" }, { status: 404 });
  }

  writeJourneys(items.filter((item) => item.id !== existing.id));
  return NextResponse.json({ deleted: true });
}
