import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const AVAILABILITY = new Set(["AVAILABLE", "RESERVED", "SOLD"]);

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function integer(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const slug = slugify(String(body.slug || title));
    const price = integer(body.price);
    const discountPrice = body.discountPrice === "" || body.discountPrice == null ? null : integer(body.discountPrice);
    const information = String(body.information ?? "").trim();
    const login = String(body.login ?? "").trim();
    const availability = String(body.availability ?? "AVAILABLE");
    const bundle = integer(body.bundle), evoGun = integer(body.evoGun), emote = integer(body.emote), level = integer(body.level);
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.map(String).map((url: string) => url.trim()).filter((url: string) => /^https?:\/\//i.test(url)).slice(0, 8)
      : [];

    if (!title || !slug || price === null || !information || !login || !AVAILABILITY.has(availability) ||
        [bundle, evoGun, emote, level].some((value) => value === null)) {
      return NextResponse.json({ success: false, message: "Data produk belum lengkap atau tidak valid." }, { status: 400 });
    }
    if (discountPrice !== null && discountPrice >= price) {
      return NextResponse.json({ success: false, message: "Harga diskon harus lebih kecil dari harga normal." }, { status: 400 });
    }

    const product = await prisma.accountProduct.update({
      where: { id },
      data: {
        title, slug, price, discountPrice, information, login, availability, imageUrls,
        bundle: bundle!, evoGun: evoGun!, emote: emote!, level: level!,
        active: body.active !== false, featured: body.featured === true,
      },
    });
    return NextResponse.json({ success: true, message: "Produk berhasil diperbarui.", product });
  } catch (error) {
    const duplicate = error instanceof Error && error.message.includes("Unique constraint");
    return NextResponse.json({ success: false, message: duplicate ? "Slug sudah digunakan." : "Gagal memperbarui produk." }, { status: duplicate ? 409 : 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const { id } = await context.params;
    await prisma.accountProduct.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Produk berhasil dihapus." });
  } catch {
    return NextResponse.json({ success: false, message: "Gagal menghapus produk." }, { status: 500 });
  }
}
