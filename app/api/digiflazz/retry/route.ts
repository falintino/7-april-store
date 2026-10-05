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
 * Order khusus lama:
 *
 * Customer sudah membayar.
 * Retry ini hanya digunakan untuk
 * pemulihan transaksi provider.
 */
const SPECIAL_RETRY_INVOICE =
  "7A-20261005-665076";

const SPECIAL_RETRY_MAX_PRICE = 795;

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
     * RC45:
     * IP belum dikenali.
     *
     * RC69:
     * harga seller lebih tinggi.
     *
     * RC70:
     * Timeout Dari Biller.
     *
     * RC70 berbeda:
     *
     * Jangan langsung kirim request lagi.
     *
     * Kita ubah kembali menjadi PENDING
     * dan biarkan cron 1 menit kemudian
     * melakukan pengecekan dengan ref_id
     * yang sama.
     */

    const normalRetry =
      ["41", "45", "70"].includes(
        providerRc
      );

    /*
     * RC69 khusus order lama
     * 7A-20261005-665076.
     */

    const specialPriceRetry =
      order.invoice ===
        SPECIAL_RETRY_INVOICE &&
      providerRc ===
        "69";

    if (
      order.providerStatus !==
        "REFUND_REQUIRED" ||
      (!normalRetry &&
        !specialPriceRetry)
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
     * REF ID HARUS TETAP SAMA
     * =========================================
     */

    const refId =
      order.providerRefId ||
      order.invoice;

    /*
     * =========================================
     * RC70
     * =========================================
     *
     * Jangan request provider dalam
     * request admin ini.
     *
     * Cukup kembalikan ke PENDING.
     *
     * Cron VPS akan mengambilnya
     * pada siklus berikutnya.
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

          paymentStatus:
            "PAID",

          providerStatus:
            "REFUND_REQUIRED",

          ...(specialPriceRetry
            ? {
                providerRc:
                  "69",

                invoice:
                  SPECIAL_RETRY_INVOICE,
              }
            : {
                providerRc: {
                  in: [
                    "41",
                    "45",
                  ],
                },
              }),
        },

        data: {
          providerStatus:
            "PENDING",

          providerRefId:
            refId,

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
     * RC41 / RC45 / RC69
     * =========================================
     *
     * Untuk retry manual yang memang sudah
     * diperbolehkan, proses sekarang.
     *
     * RC70 sudah ditangani di atas dan
     * sengaja tidak masuk ke sini.
     */

    try {
      const result =
        await processOrderDelivery(
          order.id
        );

      return NextResponse.json({
        success: true,

        deferred:
          false,

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