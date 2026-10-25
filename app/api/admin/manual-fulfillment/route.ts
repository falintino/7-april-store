import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  invoice?: unknown;
};

const MANUAL_MARKER = "[DIPENUHI_MANUAL]";

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as RequestBody;
    const invoice = String(body.invoice ?? "").trim();

    if (!/^7A-\d{8}-\d{6}$/.test(invoice)) {
      return NextResponse.json(
        { success: false, message: "Format invoice tidak valid." },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { invoice },
      select: {
        id: true,
        invoice: true,
        paymentStatus: true,
        providerStatus: true,
        providerMessage: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }

    if (order.providerMessage?.startsWith(MANUAL_MARKER)) {
      return NextResponse.json({
        success: true,
        message: "Pesanan ini sudah ditandai dipenuhi manual.",
      });
    }

    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { success: false, message: "Hanya pesanan yang sudah dibayar yang dapat ditandai." },
        { status: 409 },
      );
    }

    if (!["REFUND_REQUIRED", "FAILED"].includes(order.providerStatus)) {
      return NextResponse.json(
        { success: false, message: "Status provider tidak memenuhi syarat. Jangan tandai pesanan pending atau sukses." },
        { status: 409 },
      );
    }

    const timestamp = new Date().toISOString();
    const previousMessage = order.providerMessage?.trim();
    const updatedMessage = [
      MANUAL_MARKER,
      `Terpenuhi manual oleh admin pada ${timestamp}.`,
      previousMessage ? `Pesan provider sebelumnya: ${previousMessage}` : "",
    ].filter(Boolean).join(" ");

    const updated = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: "PAID",
        providerStatus: order.providerStatus,
        providerMessage: order.providerMessage,
      },
      data: {
        providerMessage: updatedMessage,
        updatedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      return NextResponse.json(
        { success: false, message: "Status pesanan berubah saat diproses. Muat ulang dan periksa kembali." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Berhasil ditandai dipenuhi manual. Status Digiflazz asli tetap disimpan.",
      invoice,
    });
  } catch (error) {
    console.error("MANUAL FULFILLMENT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan status pemenuhan manual." },
      { status: 500 },
    );
  }
}
