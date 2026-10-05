import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { processOrderDelivery } from "@/lib/order-delivery";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET_INVOICE = "7A-20261005-665076";

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      invoice?: unknown;
    };

    const invoice = String(body.invoice ?? "").trim();

    /*
     * Endpoint sengaja dibatasi ke order ini saja.
     */
    if (invoice !== TARGET_INVOICE) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice tidak diizinkan untuk sinkronisasi.",
        },
        { status: 403 },
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        invoice,
      },
      select: {
        id: true,
        invoice: true,
        paymentStatus: true,
        providerStatus: true,
        providerRefId: true,
        providerRc: true,
        providerMessage: true,
        providerActualPrice: true,
        providerSn: true,
        providerPriceSnapshot: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "Pembayaran order belum PAID.",
          paymentStatus: order.paymentStatus,
        },
        { status: 409 },
      );
    }

    /*
     * Order terakhir sudah berhasil dikirim ke Digiflazz
     * dan sekarang berada di PENDING.
     *
     * Kita hanya melakukan sinkronisasi menggunakan ref_id
     * yang sama. Tidak membuat invoice/ref_id baru.
     */
    if (order.providerStatus !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order tidak sedang PENDING sehingga tidak perlu disinkronkan.",
          providerStatus: order.providerStatus,
          providerRc: order.providerRc ?? null,
          refId: order.providerRefId ?? order.invoice,
        },
        { status: 409 },
      );
    }

    const result = await processOrderDelivery(order.id);

    const latest = await prisma.order.findUnique({
      where: {
        id: order.id,
      },
      select: {
        invoice: true,
        paymentStatus: true,
        providerStatus: true,
        providerRefId: true,
        providerRc: true,
        providerMessage: true,
        providerActualPrice: true,
        providerSn: true,
        providerPriceSnapshot: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sinkronisasi Digiflazz selesai.",
      result: {
        skipped: result.skipped,
        providerStatus: result.providerStatus,
        refId: result.refId ?? null,
        rc: result.rc ?? null,
        message: result.message ?? null,
        sn: result.sn ?? null,
        price: result.price ?? null,
      },
      order: latest,
    });
  } catch (error) {
    console.error("DIGIFLAZZ SYNC ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal melakukan sinkronisasi Digiflazz.",
      },
      { status: 500 },
    );
  }
}