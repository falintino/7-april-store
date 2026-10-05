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

/*
 * TEST KHUSUS VEXXA
 *
 * Hanya invoice ini yang boleh
 * retry RC69 dengan max_price 6025.
 *
 * Tujuannya untuk menguji apakah
 * seller VEXXA / FF50 benar-benar
 * bisa memproses UID customer.
 *
 * Jangan dipakai untuk invoice lain.
 */
const VEXXA_TEST_INVOICE =
  "7A-20261005-324423";

const VEXXA_TEST_MAX_PRICE = 6025;

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
     * RC70 tidak langsung dikirim ulang.
     * Dikembalikan ke PENDING.
     */

    const normalRetry =
      ["41", "45", "70"].includes(
        providerRc
      );

    /*
     * RC69 khusus order lama.
     */

    const specialPriceRetry =
      order.invoice ===
        SPECIAL_RETRY_INVOICE &&
      providerRc ===
        "69";

    /*
     * RC69 khusus test VEXXA.
     */

    const vexxaTestRetry =
      order.invoice ===
        VEXXA_TEST_INVOICE &&
      providerRc ===
        "69";

    /*
     * Apakah retry ini termasuk
     * retry dengan harga khusus?
     */

    const priceRetry =
      specialPriceRetry ||
      vexxaTestRetry;

    /*
     * max_price yang akan dipakai.
     */

    const retryMaxPrice =
      vexxaTestRetry
        ? VEXXA_TEST_MAX_PRICE
        : SPECIAL_RETRY_MAX_PRICE;

    /*
     * =========================================
     * VALIDASI RETRY
     * =========================================
     */

    if (
      order.providerStatus !==
        "REFUND_REQUIRED" ||
      (!normalRetry &&
        !priceRetry)
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
          id:
            order.id,

          paymentStatus:
            "PAID",

          providerStatus:
            "REFUND_REQUIRED",

          /*
           * Untuk VEXXA / retry khusus,
           * wajib RC69.
           */
          ...(priceRetry
            ? {
                providerRc:
                  "69",

                /*
                 * Jangan sampai invoice
                 * lain lolos sebagai VEXXA.
                 */
                invoice:
                  order.invoice,
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

          ...(priceRetry
            ? {
                providerPriceSnapshot:
                  retryMaxPrice,

                providerMessage:
                  vexxaTestRetry
                    ? "Test VEXXA FF50 dengan batas harga Rp6.025. Selisih harga provider ditanggung toko khusus untuk pengujian invoice ini."
                    : "Retry Digiflazz dengan batas harga Rp795. Selisih harga seller Rp45 ditanggung toko.",
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
     * PROSES RETRY
     * =========================================
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
          vexxaTestRetry
            ? "Test VEXXA FF50 dengan batas harga Rp6.025 selesai diproses."
            : specialPriceRetry
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

        vexxaTestRetry,

        maxPrice:
          priceRetry
            ? retryMaxPrice
            : null,

        /*
         * Test VEXXA:
         * 6025 - 5565 = 460
         */
        storeAbsorbsDifference:
          vexxaTestRetry
            ? 460
            : specialPriceRetry
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