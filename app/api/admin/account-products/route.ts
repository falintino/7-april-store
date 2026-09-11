import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AVAILABILITY = new Set(["AVAILABLE", "RESERVED", "SOLD"]);

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function integer(value: unknown, min = 0) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min ? number : null;
}

function readPayload(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const slug = slugify(String(body.slug || title));
  const price = integer(body.price);
  const discountPrice = body.discountPrice === "" || body.discountPrice == null
    ? null : integer(body.discountPrice);
  const information = String(body.information ?? "").trim();
  const login = String(body.login ?? "").trim();
  const availability = String(body.availability ?? "AVAILABLE");
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.map(String).map((url) => url.trim()).filter((url) => /^https?:\/\//i.test(url)).slice(0, 8)
    : [];

  if (!title || !slug || price === null || !information || !login || !AVAILABILITY.has(availability)) {
    return { error: "Judul, harga, informasi, login, dan status wajib diisi dengan benar." } as const;
  }
  if (discountPrice !== null && (discountPrice >= price || discountPrice < 0)) {
    return { error: "Harga diskon harus lebih kecil dari harga normal." } as const;
  }

  const stats = {
    bundle: integer(body.bundle),
    evoGun: integer(body.evoGun),
    emote: integer(body.emote),
    level: integer(body.level),
  };
  if (Object.values(stats).some((value) => value === null)) {
    return { error: "Statistik akun harus berupa angka nol atau lebih." } as const;
  }

  return {
    data: {
      title, slug, price, discountPrice, information, login, availability, imageUrls,
      bundle: stats.bundle!, evoGun: stats.evoGun!, emote: stats.emote!, level: stats.level!,
      active: body.active !== false,
      featured: body.featured === true,
    },
  } as const;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false }, { status: 401 });
  const products = await prisma.accountProduct.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, products });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const parsed = readPayload(await request.json());
    if ("error" in parsed) return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    const product = await prisma.accountProduct.create({ data: parsed.data });
    return NextResponse.json({ success: true, message: "Produk berhasil ditambahkan.", product }, { status: 201 });
  } catch (error) {
    const duplicate = error instanceof Error && error.message.includes("Unique constraint");
    return NextResponse.json(
      { success: false, message: duplicate ? "Slug sudah digunakan." : "Gagal menambahkan produk." },
      { status: duplicate ? 409 : 500 }
    );
  }
}
