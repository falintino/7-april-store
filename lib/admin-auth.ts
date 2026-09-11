import crypto from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "admin_session";

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function isAdminAuthenticated() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret) return false;

  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = crypto.createHmac("sha256", secret).update(password).digest("hex");
  return safeEqual(token, expected);
}
