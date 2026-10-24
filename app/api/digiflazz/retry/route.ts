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

/* RC69 khusus invoice 250 Diamond yang sedang dipulihkan. */
const CURRENT_RC69_RETRY_INVOICE = "7A-20261017-179905";
const CURRENT_RC69_RETRY_MAX_PRICE = 32000;

/* Retry khusus invoice 160 Diamond setelah pergantian seller. */
const CURRENT_SELLER_RETRY_INVOICE = "7A-20261018-496191";
const CURRENT_SELLER_RETRY_MAX_PRICE = 20000;

/* Retry khusus invoice 40 Diamond; toko menanggung selisih harga seller. */
const CURRENT_40DM_RETRY_INVOICE = "7A-20261018-303451";
const CURRENT_40DM_RETRY_MAX_PRICE = 6000;

/* Retry khusus promo 100 Diamond setelah seller diganti ke Omah Pulsa. */
const CURRENT_100DM_PROMO_RETRY_INVOICE = "7A-20261018-907520";
const CURRENT_100DM_PROMO_RETRY_MAX_PRICE = 12000;

/* Retry khusus invoice promo teman untuk 355 Diamond; toko menanggung diskon. */
const CURRENT_355DM_PROMO_RETRY_INVOICE = "7A-20261024-747258";
const CURRENT_355DM_PROMO_RETRY_MAX_PRICE = 41255;

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

    // Allow manual recovery for any known provider RC after admin confirms
    // the old transaction failed and the seller/SKU is corrected.
    // RC70 remains a status check using the existing ref_id, never a new sale.
    const normalRetry = providerRc.length > 0;

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

    const currentInvoicePriceRetry =
      order.invoice === CURRENT_RC69_RETRY_INVOICE &&
      ["69", "02"].includes(providerRc);

    const currentInvoiceSellerRetry =
      order.invoice === CURRENT_SELLER_RETRY_INVOICE &&
      providerRc === "02";

    const currentInvoice40DmRetry =
      order.invoice === CURRENT_40DM_RETRY_INVOICE &&
      ["69", "02"].includes(providerRc);

    const currentInvoice100DmPromoRetry =
      order.invoice === CURRENT_100DM_PROMO_RETRY_INVOICE &&
      providerRc === "02";

    const currentInvoice355DmPromoRetry =
      order.invoice === CURRENT_355DM_PROMO_RETRY_INVOICE &&
      providerRc === "69";

    const currentInvoiceSpecialRetry =
      currentInvoicePriceRetry || currentInvoiceSellerRetry || currentInvoice40DmRetry || currentInvoice100DmPromoRetry || currentInvoice355DmPromoRetry;

    const priceRetry =
      specialPriceRetry ||
      vexxaTestRetry ||
      currentInvoiceSpecialRetry;

    /*
     * max_price yang akan dipakai.
     */

    const retryMaxPrice =
      vexxaTestRetry
        ? VEXXA_TEST_MAX_PRICE
        : currentInvoicePriceRetry
          ? CURRENT_RC69_RETRY_MAX_PRICE
          : currentInvoiceSellerRetry
            ? CURRENT_SELLER_RETRY_MAX_PRICE
            : currentInvoice40DmRetry
              ? CURRENT_40DM_RETRY_MAX_PRICE
              : currentInvoice100DmPromoRetry
                ? CURRENT_100DM_PROMO_RETRY_MAX_PRICE
                : currentInvoice355DmPromoRetry
                  ? CURRENT_355DM_PROMO_RETRY_MAX_PRICE
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

    const refId =
      (providerRc !== "70" && (normalRetry || currentInvoiceSellerRetry || currentInvoice40DmRetry || currentInvoice100DmPromoRetry || currentInvoice355DmPromoRetry))
        ? nextSellerRetryRefId(
            order.invoice,
            order.providerRefId
          )
        : order.providerRefId ||
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
                  currentInvoiceSpecialRetry ? providerRc : "69",

                /*
                 * Jangan sampai invoice
                 * lain lolos sebagai VEXXA.
                 */
                invoice:
                  order.invoice,
              }
            : {
                providerRc,
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
                    : currentInvoicePriceRetry
                      ? `Retry pemulihan khusus invoice ini (RC ${providerRc}) menggunakan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}; selisih harga ditanggung toko.`
                      : currentInvoiceSellerRetry
                        ? `Retry khusus invoice 160 Diamond setelah pergantian seller (RC ${providerRc}) menggunakan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}.`
                        : currentInvoice40DmRetry
                          ? `Retry khusus invoice 40 Diamond (RC ${providerRc}) menggunakan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}. Selisih harga seller ditanggung toko.`
                          : currentInvoice100DmPromoRetry
                            ? `Retry khusus invoice promo 100 Diamond (RC ${providerRc}) menggunakan Ref ID baru dan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}. Selisih harga seller ditanggung toko.`
                            : currentInvoice355DmPromoRetry
                              ? `Retry khusus invoice promo teman 355 Diamond (RC ${providerRc}) menggunakan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}. Diskon ditanggung toko.`
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

        message:
          vexxaTestRetry
            ? "Test VEXXA FF50 dengan batas harga Rp6.025 selesai diproses."
            : currentInvoicePriceRetry
              ? `Retry pemulihan khusus invoice ini (RC awal ${providerRc}) selesai diproses dengan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}.`
              : currentInvoiceSellerRetry
                ? `Retry invoice 160 Diamond setelah pergantian seller selesai diproses dengan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}.`
                : currentInvoice40DmRetry
                  ? `Retry invoice 40 Diamond selesai diproses dengan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}.`
                  : currentInvoice100DmPromoRetry
                    ? `Retry invoice promo 100 Diamond selesai diproses dengan Ref ID baru dan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}.`
                    : currentInvoice355DmPromoRetry
                      ? `Retry invoice promo teman 355 Diamond selesai diproses dengan max_price Rp${retryMaxPrice.toLocaleString("id-ID")}.`
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

        specialPriceRetry,

        vexxaTestRetry,

        currentInvoicePriceRetry,

        currentInvoiceSellerRetry,

        currentInvoice40DmRetry,

        currentInvoice100DmPromoRetry,

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
              : currentInvoice40DmRetry
                ? 135
                : currentInvoice100DmPromoRetry
                  ? 6430
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