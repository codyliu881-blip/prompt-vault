import { createHash } from "node:crypto";

export const AUTH_COOKIE = "pv_auth";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 180; // 180 天

export function expectedAuthToken() {
  const password = process.env.ACCESS_PASSWORD?.trim();
  if (!password) {
    throw new Error("缺少环境变量 ACCESS_PASSWORD");
  }
  return createHash("sha256").update(password).digest("hex");
}

export function isValidPassword(input: string) {
  const password = process.env.ACCESS_PASSWORD?.trim();
  return Boolean(password) && input === password;
}
