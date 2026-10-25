import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }
    const body = await request.json() as {
      sku?: unknown;
      price?: unknown;
      active?: unknown;
      confirmDeliveryType?: unknown;
    };
    const sku = String(body.sku ?? "").trim();
    if (!sku || typeof body.active !== "boolean") {
      return NextResponse.json({ success: false, message: "SKU dan status aktif wajib diisi." }, { status: 400 });
    }
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product || !["Mobile Legends", "Roblox"].includes(product.game)) {
      return NextResponse.json({ success: false, message: "Produk game tidak ditemukan." }, { status: 404 });
    }
    const price = body.price === undefined ? product.price : Number(body.price);
    if (!Number.isSafeInteger(price) || price <= 0) {
      return NextResponse.json({ success: false, message: "Harga jual harus berupa bilangan rupiah bulat positif." }, { status: 400 });
    }
    if (body.active && price < product.providerPrice) {
      return NextResponse.json({ success: false, message: "Harga jual tidak boleh di bawah modal Digiflazz." }, { status: 409 });
    }
    if (body.active && product.game === "Roblox" && body.confirmDeliveryType !== true) {
      return NextResponse.json({ success: false, message: "Sebelum mengaktifkan Roblox, pastikan SKU ini adalah top-up langsung yang menerima username/ID sebagai customer_no, bukan voucher/kode redeem." }, { status: 409 });
    }
    const updated = await prisma.product.update({
      where: { sku },
      data: { price, active: body.active },
      select: { game: true, name: true, sku: true, price: true, providerPrice: true, active: true },
    });
    return NextResponse.json({
      success: true,
      product: updated,
      message: updated.active ? "Produk aktif dan dapat dibeli." : "Produk dinonaktifkan.",
    });
  } catch (error) {
    console.error("GAME CATALOG UPDATE ERROR:", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui produk game." }, { status: 500 });
  }
}
