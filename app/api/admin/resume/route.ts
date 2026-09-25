import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  parseResumePayload,
  readResume,
  ResumeValidationError,
  writeResume,
} from "@/lib/server/resume";
import { PersistentStorageUnavailableError } from "@/lib/server/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET() {
  if (!hasAdminSession()) return unauthorized();

  try {
    return NextResponse.json(
      { item: await readResume() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Resume could not be read", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "简历暂时无法读取" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession()) return unauthorized();

  try {
    const resume = parseResumePayload(await request.json());
    await writeResume(resume);
    revalidatePath("/resume");
    return NextResponse.json({ item: resume, message: "简历已保存并同步到前台" });
  } catch (error) {
    if (error instanceof ResumeValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Resume update failed", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "简历保存失败，请稍后重试" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}
