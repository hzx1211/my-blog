import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import {
  parseResumePayload,
  readResume,
  ResumeValidationError,
  writeResume,
} from "@/lib/server/resume";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET() {
  if (!hasAdminSession()) return unauthorized();

  return NextResponse.json(
    { item: readResume() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  if (!hasAdminSession()) return unauthorized();

  try {
    const resume = parseResumePayload(await request.json());
    writeResume(resume);
    revalidatePath("/resume");
    return NextResponse.json({ item: resume, message: "简历已保存并同步到前台" });
  } catch (error) {
    if (error instanceof ResumeValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Resume update failed", error);
    return NextResponse.json({ message: "简历保存失败，请稍后重试" }, { status: 500 });
  }
}
