import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE = "admin_session";
function validSession(value?: string) {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!value || !password || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(password).digest("hex");
  const a = Buffer.from(value); const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export async function POST(request: NextRequest) {
  const jar = await cookies();
  if (!validSession(jar.get(COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.formData();
  const category = String(data.get("category") || "").trim();
  const description = String(data.get("description") || "").trim();
  const amount = Number(data.get("amount"));
  const spentAtValue = String(data.get("spentAt") || "");
  if (!category || !description || description.length > 160 || !Number.isSafeInteger(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(spentAtValue)) {
    return NextResponse.json({ error: "Data pengeluaran tidak valid." }, { status: 400 });
  }
  const spentAt = new Date(`${spentAtValue}T00:00:00+07:00`);
  if (Number.isNaN(spentAt.getTime())) return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
  await prisma.operatingExpense.create({ data: { category, description, amount, spentAt } });
  return NextResponse.redirect(new URL("/admin/finance", request.url), 303);
}
