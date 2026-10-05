import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { processOrderDelivery } from "@/lib/order-delivery";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  invoice?: unknown;
};

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

    const body = (await request.json()) as RequestBody;
    const invoice = String(body.invoice ?? "").trim();

    if (!/^7A-\d{8}-\d{6}$/.test(invoice)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format invoice tidak valid.",
        },
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
        providerRc: true,
        providerRefId: true,
        providerMessage: true,
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
          message: "Order belum berstatus PAID.",
        },
        { status: 409 },
      );
    }

    /*
     * Hanya izinkan retry untuk kasus RC 41.
     *
     * RC 41 = Signature tidak valid
     * dan Digiflazz menyatakan transaksi
     * belum terbentuk.
     */
    const retryableRc = ["41", "45"];

if (
  order.providerStatus !== "REFUND_REQUIRED" ||
  !retryableRc.includes(String(order.providerRc ?? "").trim())
) {
      return NextResponse.json(
        {
          success: false,
          message:
  "Order tidak memenuhi syarat retry Digiflazz. Hanya REFUND_REQUIRED dengan RC 41 atau 45 yang dapat di-retry.",
          providerStatus: order.providerStatus,
          providerRc: order.providerRc ?? null,
        },
        { status: 409 },
      );
    }

    /*
     * Gunakan ref_id yang sama agar retry tetap
     * mengacu ke transaksi/order yang sama.
     */
    const refId = order.providerRefId || order.invoice;

    /*
     * Atomic claim:
     * mencegah dua request retry berjalan bersamaan.
     */
    const claimed = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: "PAID",
        providerStatus: "REFUND_REQUIRED",
        providerRc: {
  in: ["41", "45"],
},
      },
      data: {
        providerStatus: "PENDING",
        providerRefId: refId,
        providerMessage:
          "Retry Digiflazz dijalankan setelah RC 41 diperbaiki.",
        providerUpdatedAt: new Date(),
      },
    });

    if (claimed.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order sedang berubah status atau sudah diproses. Silakan cek status order.",
        },
        { status: 409 },
      );
    }

    try {
      const result = await processOrderDelivery(order.id);

      return NextResponse.json({
        success: true,
        message: "Retry Digiflazz selesai diproses.",
        invoice: order.invoice,
        providerStatus: result.providerStatus,
        refId: result.refId ?? refId,
        rc: result.rc ?? null,
        providerMessage: result.message ?? null,
        sn: result.sn ?? null,
        price: result.price ?? null,
      });
    } catch (error) {
      console.error("DIGIFLAZZ RETRY ERROR:", {
        invoice: order.invoice,
        refId,
        error: error instanceof Error ? error.message : error,
      });

      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Retry Digiflazz gagal.",
          invoice: order.invoice,
          refId,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("DIGIFLAZZ RETRY ENDPOINT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal menjalankan retry Digiflazz.",
      },
      { status: 500 },
    );
  }
}