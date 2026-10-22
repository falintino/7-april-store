import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { approved: true, order: { product: { game: "Free Fire" }, paymentStatus: { in: ["PAID", "SUCCESS"] }, providerStatus: { in: ["SUCCESS", "SUKSES"] } } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, rating: true, comment: true, displayName: true, createdAt: true },
    });
    const count = reviews.length;
    const average = count ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / count) * 10) / 10 : 0;
    return NextResponse.json({ count, average, reviews: reviews.map((review) => ({ ...review, createdAt: review.createdAt.toISOString() })) }, { headers });
  } catch (error) {
    console.error("Gagal memuat ulasan Free Fire:", error);
    return NextResponse.json({ message: "Ulasan belum tersedia." }, { status: 503, headers });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const invoice = typeof body.invoice === "string" ? body.invoice.trim() : "";
    const uid = typeof body.uid === "string" ? body.uid.replace(/\D/g, "") : "";
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const displayNameRaw = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const displayName = (displayNameRaw || "Pelanggan").slice(0, 40);

    if (!invoice || !/^\d{6,20}$/.test(uid) || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 5 || comment.length > 500) {
      return NextResponse.json({ message: "Isi invoice, UID, rating 1–5, dan ulasan 5–500 karakter." }, { status: 400, headers });
    }

    const order = await prisma.order.findFirst({
      where: {
        invoice, uid,
        paymentStatus: { in: ["PAID", "SUCCESS"] },
        providerStatus: { in: ["SUCCESS", "SUKSES"] },
        product: { game: "Free Fire" },
      },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json({ message: "Pesanan berhasil untuk invoice dan UID tersebut tidak ditemukan. Ulasan hanya untuk pembeli terverifikasi." }, { status: 403, headers });
    }

    const review = await prisma.review.create({
      data: { orderId: order.id, rating, comment, displayName, approved: true },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, reviewId: review.id, message: "Terima kasih! Ulasan pembelianmu berhasil dikirim." }, { status: 201, headers });
  } catch (error) {
    // Prisma P2002: one review per order.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ message: "Pesanan ini sudah memiliki ulasan." }, { status: 409, headers });
    }
    console.error("Gagal menyimpan ulasan Free Fire:", error);
    return NextResponse.json({ message: "Ulasan belum dapat disimpan. Coba lagi nanti." }, { status: 500, headers });
  }
}
