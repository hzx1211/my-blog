import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const adminCookieName = "my_blog_admin_session";
const knownInsecurePasswordHashes = new Set([
  "3f31822c4ad3d64658444f51f00aa2b69f9ffbfde002f5786d7b1e73a41d7f81",
]);

export function isSecureCookie(request: Request) {
  return request.headers.get("x-forwarded-proto") === "https" || new URL(request.url).protocol === "https:";
}

function configuredPassword() {
  return process.env.BLOG_ADMIN_PASSWORD?.trim() ?? "";
}

function sessionSecret() {
  return process.env.BLOG_SESSION_SECRET?.trim() || configuredPassword();
}

export function isAdminPasswordConfigured() {
  const password = configuredPassword();
  const secret = sessionSecret();
  const hasUsableLengths = password.length >= 6 && secret.length >= 32;
  const hasProductionPasswordLength = password.length >= 12;
  const usesSeparateSecret = password !== secret;
  const passwordHash = createHash("sha256").update(password).digest("hex");
  const usesKnownDefault = knownInsecurePasswordHashes.has(passwordHash);

  if (!hasUsableLengths || !usesSeparateSecret) return false;
  if (process.env.NODE_ENV === "production" && (!hasProductionPasswordLength || usesKnownDefault)) return false;

  return true;
}

export function createAdminSession(password: string) {
  if (!isAdminPasswordConfigured() || password !== configuredPassword()) {
    return null;
  }

  return createHmac("sha256", sessionSecret()).update(password).digest("hex");
}

export function isValidAdminSession(value: string | undefined) {
  const expected = createAdminSession(configuredPassword());

  if (!value || !expected || value.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export function hasAdminSession() {
  return isValidAdminSession(cookies().get(adminCookieName)?.value);
}
