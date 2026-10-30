import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { processOrderDelivery } from "@/lib/order-delivery";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  invoice?: unknown;
  maxPrice?: unknown;
};

export async function POST(
  request: Request
) {
  try {
    /*
     * =========================================
     * ADMIN AUTH
     * =========================================
     */

    if (
      !(await isAdminAuthenticated())
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Akses ditolak.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * =========================================
     * INPUT
     * =========================================
     */

    const body =
      (await request.json()) as RequestBody;

    const invoice =
      String(
        body.invoice ?? ""
      ).trim();

    if (
      !/^7A-\d{8}-\d{6}$/.test(
        invoice
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Format invoice tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * AMBIL ORDER
     * =========================================
     */

    const order =
      await prisma.order.findUnique({
        where: {
          invoice,
        },

        select: {
          id: true,

          invoice: true,

          paymentStatus: true,

          providerStatus: true,

          providerRc: true,

          providerRefId: true,

          providerMessage: true,

          providerPriceSnapshot:
            true,

          total: true,

          subtotal: true,

          discountAmount: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Order tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =========================================
     * PAYMENT HARUS PAID
     * =========================================
     */

    if (
      order.paymentStatus !==
      "PAID"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Order belum berstatus PAID.",
        },
        {
          status: 409,
        }
      );
    }

    if (order.providerMessage?.startsWith("[DIPENUHI_MANUAL]")) {
      return NextResponse.json(
        { success: false, message: "Pesanan sudah ditandai dipenuhi manual. Retry Digiflazz diblokir untuk mencegah pengiriman ganda." },
        { status: 409 },
      );
    }

    const providerRc =
      String(
        order.providerRc ??
          ""
      ).trim();

    /*
     * =========================================
     * JENIS RETRY
     * =========================================
     *
     * RC41:
     * signature invalid.
     *
     * RC44:
     * Retry manual setelah saldo buyer dicukupkan.
     *
     * RC45:
     * IP belum dikenali.
     *
     * RC69:
     * harga seller lebih tinggi.
     *
     * RC70:
     * Timeout Dari Biller.
     *
     * RC70 tidak langsung dikirim ulang.
     * Dikembalikan ke PENDING.
     */

    const requestedMaxPrice = body.maxPrice === undefined || body.maxPrice === null || body.maxPrice === "" ? null : Number(body.maxPrice);
    if (requestedMaxPrice !== null && (!Number.isSafeInteger(requestedMaxPrice) || requestedMaxPrice <= 0)) return NextResponse.json({ success: false, message: "max_price harus berupa angka rupiah bulat yang lebih besar dari 0." }, { status: 400 });
    const priceRetry = requestedMaxPrice !== null;
    const retryMaxPrice = requestedMaxPrice;
    const normalRetry = providerRc.length > 0;
    if (priceRetry && !["69", "02"].includes(providerRc)) return NextResponse.json({ success: false, message: "Override harga hanya diperbolehkan untuk RC69 atau RC02." }, { status: 409 });
    const estimatedSubsidy = priceRetry ? Math.max(0, requestedMaxPrice! - Math.max(0, order.total)) : 0;

    /*
     * =========================================
     * VALIDASI RETRY
     * =========================================
     */

    if (
      order.providerStatus !==
        "REFUND_REQUIRED" ||
      !normalRetry
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Order tidak memenuhi syarat retry Digiflazz.",

          providerStatus:
            order.providerStatus,

          providerRc:
            order.providerRc ??
            null,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =========================================
     * REF ID RETRY
     * =========================================
     *
     * Untuk invoice 160 Diamond yang sudah
     * dikonfirmasi gagal/invalid oleh CS:
     * setiap retry memakai Ref ID provider baru.
     *
     * Retry lain tetap mempertahankan Ref ID
     * agar alur pengecekan transaksi pending
     * tidak berubah.
     */
    function nextSellerRetryRefId(
      invoiceValue: string,
      previousRefId: string | null
    ) {
      const prefix = `${invoiceValue}-R`;
      const previousAttempt =
        previousRefId?.startsWith(prefix)
          ? Number(previousRefId.slice(prefix.length))
          : 0;
      const nextAttempt =
        Number.isInteger(previousAttempt) && previousAttempt > 0
          ? previousAttempt + 1
          : 1;

      return `${prefix}${nextAttempt}`;
    }

    const refId = providerRc !== "70" ? nextSellerRetryRefId(order.invoice, order.providerRefId) : order.providerRefId || order.invoice;

    /*
     * =========================================
     * RC70
     * =========================================
     *
     * Jangan request provider langsung.
     *
     * Kembalikan ke PENDING dan tunggu
     * checker berikutnya.
     */

    if (
      providerRc ===
      "70"
    ) {
      const claimed =
        await prisma.order.updateMany({
          where: {
            id:
              order.id,

            paymentStatus:
              "PAID",

            providerStatus:
              "REFUND_REQUIRED",

            providerRc:
              "70",
          },

          data: {
            providerStatus:
              "PENDING",

            providerRefId:
              refId,

            providerMessage:
              "Biller timeout. Transaksi dikembalikan ke PENDING untuk pengecekan ulang menggunakan ref_id yang sama.",

            providerUpdatedAt:
              new Date(),
          },
        });

      if (
        claimed.count !==
        1
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Order sedang berubah status atau sudah diproses.",
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json({
        success: true,

        deferred:
          true,

        message:
          "RC70 dipulihkan menjadi PENDING. Checker berikutnya akan mengecek transaksi menggunakan ref_id yang sama.",

        invoice:
          order.invoice,

        providerStatus:
          "PENDING",

        refId,

        rc:
          "70",

        nextAction:
          "WAIT_CRON",
      });
    }

    /*
     * =========================================
     * ATOMIC CLAIM
     * =========================================
     */

    const claimed =
      await prisma.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: "PAID",
          providerStatus: "REFUND_REQUIRED",
          providerRc,
        },
        data: {
          providerStatus: "PENDING",
          providerRefId: refId,
          ...(priceRetry && retryMaxPrice !== null
            ? {
                providerPriceSnapshot: retryMaxPrice,
                providerMessage: `Retry manual dengan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}. Perkiraan selisih Rp${estimatedSubsidy.toLocaleString("id-ID")}; biaya aktual mengikuti respons provider.`,
              }
            : {
                providerMessage:
                  "Retry Digiflazz dijalankan setelah konfigurasi diperbaiki.",
              }),
          providerUpdatedAt: new Date(),
        },
      });

    if (
      claimed.count !==
      1
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Order sedang berubah status atau sudah diproses. Silakan cek status order.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =========================================
     * PROSES RETRY
     * =========================================
     */

    try {
      const result =
        await processOrderDelivery(
          order.id
        );

      const latestOrder =
        await prisma.order.findUnique({
          where: { id: order.id },
          select: {
            providerMessage: true,
            providerResponse: true,
            providerRc: true,
            providerStatus: true,
            providerRefId: true,
          },
        });

      return NextResponse.json({
        success: true,

        deferred:
          false,

        message: priceRetry ? `Retry selesai dengan max_price Rp${retryMaxPrice!.toLocaleString("id-ID")}. Estimasi subsidi Rp${estimatedSubsidy.toLocaleString("id-ID")}.` : "Retry Digiflazz selesai diproses.",

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
          latestOrder?.providerMessage ??
          result.message ??
          null,

        providerResponse:
          latestOrder?.providerResponse ??
          null,

        latestProviderRc:
          latestOrder?.providerRc ??
          result.rc ??
          null,

        latestProviderStatus:
          latestOrder?.providerStatus ??
          result.providerStatus,

        sn:
          result.sn ??
          null,

        price:
          result.price ??
          null,

        priceRetry,
        maxPrice: retryMaxPrice,
        customerTotal: order.total,
        estimatedSubsidy,
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
        }
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
        {
          status: 502,
        }
      );
    }
  } catch (error) {
    console.error(
      "DIGIFLAZZ RETRY ENDPOINT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Gagal menjalankan retry Digiflazz.",
      },
      {
        status: 500,
      }
    );
  }
}