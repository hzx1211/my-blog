import {
  isSupabasePublicMediaUrl,
  PersistentStorageUnavailableError,
  readContent,
  writeContent,
} from "@/lib/server/persistence";

export type SiteProfile = {
  homeAvatarUrl: string;
  aboutAvatarUrl: string;
};

export class SiteProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteProfileValidationError";
  }
}

export const defaultSiteProfile: SiteProfile = {
  homeAvatarUrl: "/resume-profile.jpg",
  aboutAvatarUrl: "/resume-profile.jpg",
};

const dataFile = "site-profile.json";

function isAllowedAvatarUrl(value: string) {
  if (/^\/[A-Za-z0-9/_-]+\.(?:jpe?g|png|webp|gif)$/i.test(value)) return true;
  if (/^\/api\/media\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i.test(value)) return true;
  if (!isSupabasePublicMediaUrl(value)) return false;

  try {
    return /\.(?:jpe?g|png|webp|gif)$/i.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

function safeAvatarUrl(value: unknown, fallback: string) {
  const url = typeof value === "string" ? value.trim() : "";
  return url && isAllowedAvatarUrl(url) ? url : fallback;
}

export function parseSiteProfileUpdate(input: unknown, current: SiteProfile): SiteProfile {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new SiteProfileValidationError("头像设置格式无效");
  }

  const record = input as Record<string, unknown>;
  const next = { ...current };

  for (const key of ["homeAvatarUrl", "aboutAvatarUrl"] as const) {
    if (record[key] === undefined) continue;
    const value = typeof record[key] === "string" ? record[key].trim() : "";
    if (value.length > 500 || !isAllowedAvatarUrl(value)) {
      const label = key === "homeAvatarUrl" ? "首页头像" : "关于我头像";
      throw new SiteProfileValidationError(`${label}请使用本站图片或后台上传的图片`);
    }
    next[key] = value;
  }

  return next;
}

export async function readSiteProfile(): Promise<SiteProfile> {
  let value: unknown;
  try {
    value = await readContent<unknown>("site-profile", dataFile, defaultSiteProfile);
  } catch (error) {
    // A first deployment may not have this optional settings row yet.
    if (
      error instanceof PersistentStorageUnavailableError &&
      error.message.includes("内容记录缺失")
    ) {
      return defaultSiteProfile;
    }
    throw error;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultSiteProfile;
  const record = value as Record<string, unknown>;
  return {
    homeAvatarUrl: safeAvatarUrl(record.homeAvatarUrl, defaultSiteProfile.homeAvatarUrl),
    aboutAvatarUrl: safeAvatarUrl(record.aboutAvatarUrl, defaultSiteProfile.aboutAvatarUrl),
  };
}

export async function writeSiteProfile(profile: SiteProfile) {
  await writeContent("site-profile", dataFile, profile);
}

