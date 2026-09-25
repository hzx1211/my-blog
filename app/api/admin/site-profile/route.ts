import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { PersistentStorageUnavailableError } from "@/lib/server/persistence";
import {
  parseSiteProfileUpdate,
  readSiteProfile,
  SiteProfileValidationError,
  writeSiteProfile,
} from "@/lib/server/site-profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ message: "需要管理员登录" }, { status: 401 });
}

export async function GET() {
  if (!hasAdminSession()) return unauthorized();

  try {
    return NextResponse.json(
      { item: await readSiteProfile() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Site profile could not be read", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "头像设置暂时无法读取" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession()) return unauthorized();

  try {
    const current = await readSiteProfile();
    const profile = parseSiteProfileUpdate(await request.json(), current);
    await writeSiteProfile(profile);
    revalidatePath("/");
    return NextResponse.json({ item: profile, message: "头像已保存并同步到前台" });
  } catch (error) {
    if (error instanceof SiteProfileValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Site profile update failed", error);
    return NextResponse.json(
      { message: error instanceof PersistentStorageUnavailableError ? error.message : "头像保存失败，请稍后重试" },
      { status: error instanceof PersistentStorageUnavailableError ? 503 : 500 },
    );
  }
}
