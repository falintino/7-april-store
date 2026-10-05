import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { processOrderDelivery } from "@/lib/order-delivery";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  invoice?: unknown;
};

/*
 * Order khusus yang harga seller Digiflazz naik
 * dari Rp750 menjadi Rp795.
 *
 * Customer tetap membayar Rp750.
 * Selisih Rp45 ditanggung toko.
 */
const SPECIAL_RETRY_INVOICE = "7A-20261005-665076";
const SPECIAL_RETRY_MAX_PRICE = 795;

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
          message: "Order belum berstatus PAID.",
        },
        { status: 409 },
      );
    }

    const providerRc = String(
      order.providerRc ?? "",
    ).trim();

    /*
     * RC 41 = signature invalid.
     * RC 45 = IP belum dikenali.
     *
     * Keduanya boleh di-retry setelah konfigurasi
     * diperbaiki.
     */
    const normalRetry =
      ["41", "45"].includes(providerRc);

    /*
     * RC 69 khusus untuk order ini.
     *
     * Harga seller Digiflazz terdeteksi Rp795,
     * sedangkan snapshot awal order Rp750.
     */
    const specialPriceRetry =
      order.invoice === SPECIAL_RETRY_INVOICE &&
      providerRc === "69";

    if (
      order.providerStatus !== "REFUND_REQUIRED" ||
      (!normalRetry && !specialPriceRetry)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order tidak memenuhi syarat retry Digiflazz.",
          providerStatus:
            order.providerStatus,
          providerRc:
            order.providerRc ?? null,
        },
        { status: 409 },
      );
    }

    /*
     * ref_id harus tetap sama.
     */
    const refId =
      order.providerRefId ||
      order.invoice;

    /*
     * =========================================
     * ATOMIC CLAIM
     * =========================================
     *
     * Untuk RC69 khusus order ini:
     *
     * providerPriceSnapshot:
     * Rp750 -> Rp795
     *
     * sehingga processDigiflazzOrder()
     * akan mengirim:
     *
     * max_price = 795
     *
     * Customer tetap membayar Rp750.
     */
    const claimed =
      await prisma.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: "PAID",
          providerStatus: "REFUND_REQUIRED",
          ...(specialPriceRetry
            ? {
                providerRc: "69",
                invoice:
                  SPECIAL_RETRY_INVOICE,
              }
            : {
                providerRc: {
                  in: ["41", "45"],
                },
              }),
        },

        data: {
          providerStatus: "PENDING",

          providerRefId: refId,

          ...(specialPriceRetry
            ? {
                providerPriceSnapshot:
                  SPECIAL_RETRY_MAX_PRICE,

                providerMessage:
                  "Retry Digiflazz dengan batas harga Rp795. Selisih harga seller Rp45 ditanggung toko.",
              }
            : {
                providerMessage:
                  "Retry Digiflazz dijalankan setelah konfigurasi diperbaiki.",
              }),

          providerUpdatedAt:
            new Date(),
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
      const result =
        await processOrderDelivery(
          order.id,
        );

      return NextResponse.json({
        success: true,

        message:
          specialPriceRetry
            ? "Retry Digiflazz dengan batas harga Rp795 selesai diproses."
            : "Retry Digiflazz selesai diproses.",

        invoice:
          order.invoice,

        providerStatus:
          result.providerStatus,

        refId:
          result.refId ??
          refId,

        rc:
          result.rc ??
          null,

        providerMessage:
          result.message ??
          null,

        sn:
          result.sn ??
          null,

        price:
          result.price ??
          null,

        specialPriceRetry,

        maxPrice:
          specialPriceRetry
            ? SPECIAL_RETRY_MAX_PRICE
            : null,

        storeAbsorbsDifference:
          specialPriceRetry
            ? 45
            : 0,
      });
    } catch (error) {
      console.error(
        "DIGIFLAZZ RETRY ERROR:",
        {
          invoice:
            order.invoice,

          refId,

          error:
            error instanceof Error
              ? error.message
              : error,
        },
      );

      return NextResponse.json(
        {
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Retry Digiflazz gagal.",

          invoice:
            order.invoice,

          refId,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error(
      "DIGIFLAZZ RETRY ENDPOINT ERROR:",
      error,
    );

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