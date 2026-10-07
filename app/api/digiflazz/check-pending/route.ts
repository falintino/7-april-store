import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { processOrderDelivery } from "@/lib/order-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * =========================================
 * BATAS WAKTU TRANSAKSI RC70
 * =========================================
 *
 * RC70 = Timeout Dari Biller.
 *
 * Selama belum melewati batas:
 *
 * PAID
 * ->
 * PENDING
 * ->
 * cek ulang setiap 1 menit
 *
 * Setelah 10 menit sejak RC70 pertama:
 *
 * RC70
 * ->
 * FAILED
 * ->
 * REFUND_REQUIRED
 *
 * atau refund otomatis jika:
 *
 * AUTO_REFUND_FAILED_ORDERS=true
 */
const MAX_RC70_WAIT_MS =
  10 * 60 * 1000;

function isAuthorized(
  request: Request
) {
  const cronSecret =
    process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return false;
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

function getRc70StartedAt(
  providerResponse: unknown
) {
  if (
    !providerResponse ||
    typeof providerResponse !==
      "object" ||
    Array.isArray(
      providerResponse
    )
  ) {
    return null;
  }

  const raw =
    (
      providerResponse as Record<
        string,
        unknown
      >
    )._rc70StartedAt;

  if (
    typeof raw !==
    "string"
  ) {
    return null;
  }

  const date =
    new Date(raw);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function isRc70Expired(
  providerResponse: unknown,
  providerUpdatedAt: Date | null,
  createdAt: Date
) {
  /*
   * Gunakan waktu pertama kali RC70 tercatat.
   *
   * Jangan memakai providerUpdatedAt karena
   * nilainya berubah setiap kali checker berjalan.
   *
   * Fallback ke providerUpdatedAt / createdAt
   * hanya untuk order lama.
   */
  const startedAt =
    getRc70StartedAt(
      providerResponse
    ) ??
    providerUpdatedAt ??
    createdAt;

  const age =
    Date.now() -
    startedAt.getTime();

  return (
    age >=
    MAX_RC70_WAIT_MS
  );
}

async function checkPendingOrders(
  request: Request
) {
  try {
    /*
     * =====================================
     * AUTH
     * =====================================
     */

    if (
      !isAuthorized(request)
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * =====================================
     * AMBIL ORDER
     * =====================================
     *
     * Hanya order:
     *
     * PAID
     *
     * dan provider:
     *
     * PENDING
     * FAILED
     * REFUND_REQUIRED
     *
     * serta sudah memiliki ref_id.
     *
     * PRIORITAS:
     *
     * 1. Transaksi normal / aktif
     *    yang bukan RC70.
     *
     * 2. RC70 lama diproses setelah
     *    transaksi normal habis.
     *
     * Ini mencegah satu transaksi RC70
     * lama menghalangi transaksi baru.
     */

    const pendingWhere = {
      paymentStatus:
        "PAID" as const,

      providerStatus: {
        in: [
          "PENDING",
          "FAILED",
          "REFUND_REQUIRED",
        ],
      },

      providerRefId: {
        not: null,
      },
    };

    /*
     * =====================================
     * PRIORITAS TRANSAKSI NORMAL
     * =====================================
     *
     * RC70 tidak diprioritaskan lebih dulu.
     *
     * Contoh:
     *
     * Invoice A -> RC70
     * Invoice B -> RC03 PENDING
     *
     * Maka Invoice B diproses lebih dulu.
     */

    let pendingOrders =
      await prisma.order.findMany({
        where: {
          ...pendingWhere,

          OR: [
            {
              providerRc:
                null,
            },

            {
              providerRc: {
                not: "70",
              },
            },
          ],
        },

        orderBy: {
          providerUpdatedAt:
            "asc",
        },

        take: 1,

        select: {
          id: true,

          invoice: true,

          providerRefId:
            true,

          providerUpdatedAt:
            true,

          providerStatus:
            true,

          providerRc:
            true,

          providerMessage:
            true,

          providerResponse:
            true,

          createdAt:
            true,
        },
      });

    /*
     * =====================================
     * FALLBACK KE RC70
     * =====================================
     *
     * Kalau tidak ada transaksi normal,
     * baru ambil satu transaksi RC70
     * yang paling lama.
     */

    if (
      pendingOrders.length ===
      0
    ) {
      pendingOrders =
        await prisma.order.findMany({
          where: {
            ...pendingWhere,

            providerRc:
              "70",
          },

          orderBy: {
            providerUpdatedAt:
              "asc",
          },

          take: 1,

          select: {
            id: true,

            invoice: true,

            providerRefId:
              true,

            providerUpdatedAt:
              true,

            providerStatus:
              true,

            providerRc:
              true,

            providerMessage:
              true,

            providerResponse:
              true,

            createdAt:
              true,
          },
        });
    }

    const results: Array<{
      invoice: string;

      providerStatus: string;

      refId?: string;

      rc?: string;

      message?: string;

      error?: string;

      timeout?: boolean;
    }> = [];

    /*
     * =====================================
     * PROSES SATU ORDER
     * =====================================
     */

    for (
      const order of pendingOrders
    ) {
      try {
        /*
         * ===================================
         * RC70 TIMEOUT LIMIT
         * ===================================
         *
         * Jangan terus mengecek RC70
         * selamanya.
         */

        if (
          order.providerRc ===
            "70" &&
          isRc70Expired(
            order.providerResponse,
            order.providerUpdatedAt,
            order.createdAt
          )
        ) {
          /*
           * Atomic claim:
           *
           * hanya order yang masih
           * PENDING + RC70 yang boleh
           * diubah oleh proses ini.
           */

          const claimed =
            await prisma.order.updateMany(
              {
                where: {
                  id:
                    order.id,

                  paymentStatus:
                    "PAID",

                  providerStatus:
                    "PENDING",

                  providerRc:
                    "70",
                },

                data: {
                  providerStatus:
                    "FAILED",

                  providerMessage:
                    "Biller timeout lebih dari 10 menit. Transaksi dihentikan dan masuk proses refund.",

                  providerUpdatedAt:
                    new Date(),
                },
              }
            );

          if (
            claimed.count ===
            1
          ) {
            /*
             * Jalankan alur delivery sekali lagi.
             *
             * Karena status sekarang FAILED,
             * lib/order-delivery.ts akan:
             *
             * - menggunakan fallback bila ada
             * - atau masuk requestRefund()
             *
             * Jika AUTO_REFUND_FAILED_ORDERS
             * belum aktif, status akhir:
             *
             * REFUND_REQUIRED
             */

            const result =
              await processOrderDelivery(
                order.id
              );

            results.push({
              invoice:
                order.invoice,

              providerStatus:
                result.providerStatus,

              refId:
                result.refId ??
                order.providerRefId ??
                undefined,

              rc:
                result.rc ??
                "70",

              message:
                result.message ??
                "RC70 timeout lebih dari 10 menit.",

              timeout:
                true,
            });

            continue;
          }

          /*
           * Kalau claim gagal, berarti proses
           * lain sedang mengubah order.
           */

          results.push({
            invoice:
              order.invoice,

            providerStatus:
              "PENDING",

            refId:
              order.providerRefId ??
              undefined,

            rc:
              "70",

            message:
              "Transaksi sedang diproses oleh proses lain.",

            timeout:
              true,
          });

          continue;
        }

        /*
         * ===================================
         * PROSES NORMAL
         * ===================================
         */

        const result =
          await processOrderDelivery(
            order.id
          );

        results.push({
          invoice:
            order.invoice,

          providerStatus:
            result.providerStatus,

          refId:
            result.refId,

          rc:
            result.rc,

          message:
            result.message,
        });
      } catch (error) {
        /*
         * Error jaringan / server
         * tidak boleh membuat order
         * langsung gagal.
         */

        results.push({
          invoice:
            order.invoice,

          providerStatus:
            "PENDING",

          refId:
            order.providerRefId ??
            undefined,

          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        });
      }
    }

    /*
     * =====================================
     * STATISTIK
     * =====================================
     */

    const successCount =
      results.filter(
        (item) =>
          item.providerStatus ===
          "SUCCESS"
      ).length;

    const pendingCount =
      results.filter(
        (item) =>
          item.providerStatus ===
          "PENDING"
      ).length;

    const failedCount =
      results.filter(
        (item) =>
          [
            "FAILED",
            "REFUND_REQUIRED",
            "REFUND_PENDING",
            "REFUND_PROCESSING",
          ].includes(
            item.providerStatus
          )
      ).length;

    return NextResponse.json({
      success: true,

      checked:
        pendingOrders.length,

      successCount,

      pendingCount,

      failedCount,

      maxRc70WaitMinutes:
        10,

      results,
    });
  } catch (error) {
    console.error(
      "DIGIFLAZZ PENDING CHECK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan saat mengecek transaksi pending.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * Vercel Cron / VPS Cron menggunakan GET.
 */
export async function GET(
  request: Request
) {
  return checkPendingOrders(
    request
  );
}

/*
 * POST tetap dipertahankan
 * untuk testing manual.
 */
export async function POST(
  request: Request
) {
  return checkPendingOrders(
    request
  );
}