import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: NextRequest) {
  try {
    const showAll = new URL(request.url).searchParams.get("all") === "1";
    const where = {
      approved: true,
      moderationStatus: "VISIBLE",
      order: {
        product: { game: "Free Fire" },
        paymentStatus: { in: ["PAID", "SUCCESS"] },
        providerStatus: { in: ["SUCCESS", "SUKSES"] },
      },
    };
    const [reviews, count, aggregate] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: showAll ? 100 : 3,
        select: { id: true, rating: true, comment: true, displayName: true, createdAt: true },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);
    const average = aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0;
    const session = await getSession();
    const customer = session ? await prisma.customer.findUnique({ where: { id: session.id }, select: { id: true } }) : null;
    return NextResponse.json({ count, average, canReview: Boolean(customer), reviews: reviews.map((review) => ({ ...review, createdAt: review.createdAt.toISOString() })) }, { headers });
  } catch (error) {
    console.error("Gagal memuat ulasan Free Fire:", error);
    return NextResponse.json({ message: "Ulasan belum tersedia." }, { status: 503, headers });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Login tidak diwajibkan untuk mengulas. Invoice + UID memverifikasi transaksi berhasil.
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

    const needsReview = rating <= 4;
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId: order.id,
          rating,
          comment,
          displayName,
          approved: !needsReview,
          moderationStatus: needsReview ? "PENDING_REVIEW" : "VISIBLE",
        },
        select: { id: true },
      });
      if (needsReview) {
        await tx.reviewAudit.create({
          data: {
            reviewId: created.id,
            action: "FLAGGED_LOW_RATING",
            reason: "Rating 1–4 otomatis masuk antrean pemeriksaan.",
            adminIdentifier: "system",
          },
        });
      }
      return created;
    });

    return NextResponse.json({
      ok: true,
      reviewId: review.id,
      moderationStatus: needsReview ? "PENDING_REVIEW" : "VISIBLE",
      message: needsReview
        ? "Terima kasih! Ulasanmu diterima dan akan diperiksa admin sebelum ditampilkan."
        : "Terima kasih! Rating dan ulasanmu berhasil dikirim.",
    }, { status: 201, headers });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ message: "Pesanan ini sudah memiliki ulasan." }, { status: 409, headers });
    }
    console.error("Gagal menyimpan ulasan Free Fire:", error);
    return NextResponse.json({ message: "Ulasan belum dapat disimpan. Coba lagi nanti." }, { status: 500, headers });
  }
}
