import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function isAdminAuthenticated() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(password).digest("hex");
  const token = (await cookies()).get("admin_session")?.value;
  return Boolean(token && safeEqual(token, expected));
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const reviews = await prisma.review.findMany({
      orderBy: [{ moderationStatus: "asc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true, rating: true, comment: true, displayName: true, approved: true,
        moderationStatus: true, moderationReason: true, moderatedAt: true, moderatedBy: true, createdAt: true,
        order: { select: { invoice: true, uid: true, whatsapp: true, paymentStatus: true, providerStatus: true, product: { select: { name: true } } } },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 5, select: { action: true, reason: true, adminIdentifier: true, createdAt: true } },
      },
    });
    return NextResponse.json({
      success: true,
      reviews: reviews.map((review) => ({
        ...review,
        createdAt: review.createdAt.toISOString(),
        moderatedAt: review.moderatedAt?.toISOString() ?? null,
        auditLogs: review.auditLogs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() })),
      })),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("ADMIN REVIEWS GET ERROR:", error);
    return NextResponse.json({ success: false, message: "Gagal memuat ulasan." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const reviewId = typeof body.reviewId === "string" ? body.reviewId.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

    if (!reviewId || !["publish", "hide", "pending"].includes(action)) {
      return NextResponse.json({ success: false, message: "Tindakan atau ulasan tidak valid." }, { status: 400 });
    }
    if (action === "hide" && reason.length < 5) {
      return NextResponse.json({ success: false, message: "Isi alasan minimal 5 karakter untuk menyembunyikan ulasan." }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true } });
    if (!review) return NextResponse.json({ success: false, message: "Ulasan tidak ditemukan." }, { status: 404 });

    const status = action === "publish" ? "VISIBLE" : action === "hide" ? "HIDDEN" : "PENDING_REVIEW";
    const approved = action === "publish";
    const auditAction = action === "publish" ? "PUBLISHED" : action === "hide" ? "HIDDEN" : "RETURNED_TO_REVIEW";
    await prisma.$transaction([
      prisma.review.update({
        where: { id: reviewId },
        data: {
          moderationStatus: status,
          approved,
          moderationReason: reason || null,
          moderatedAt: new Date(),
          moderatedBy: "admin",
        },
      }),
      prisma.reviewAudit.create({
        data: {
          reviewId,
          action: auditAction,
          reason: reason || null,
          adminIdentifier: "admin",
        },
      }),
    ]);
    return NextResponse.json({ success: true, message: action === "publish" ? "Ulasan ditampilkan." : action === "hide" ? "Ulasan disembunyikan." : "Ulasan dikembalikan ke antrean pemeriksaan." });
  } catch (error) {
    console.error("ADMIN REVIEWS PATCH ERROR:", error);
    return NextResponse.json({ success: false, message: "Tindakan gagal disimpan." }, { status: 500 });
  }
}
