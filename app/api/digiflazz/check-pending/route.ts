import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { processDigiflazzOrder } from "@/lib/digiflazz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret =
    process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return false;
  }

  const authorization =
    request.headers.get("authorization");

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

async function checkPendingOrders(
  request: Request
) {
  try {
    /*
     * Vercel Cron otomatis mengirim:
     *
     * Authorization:
     * Bearer <CRON_SECRET>
     *
     * Route juga tetap bisa dites
     * manual menggunakan header yang sama.
     */
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Hanya ambil order yang:
     *
     * - pembayaran sudah PAID
     * - provider masih PENDING
     * - sudah pernah dikirim ke Digiflazz
     *
     * providerRefId wajib ada supaya
     * order lama yang belum pernah dikirim
     * tidak tiba-tiba ikut diproses.
     */
    const pendingOrders =
      await prisma.order.findMany({
        where: {
          paymentStatus: "PAID",

          providerStatus: "PENDING",

          providerRefId: {
            not: null,
          },
        },

        orderBy: {
          providerUpdatedAt: "asc",
        },

        take: 20,

        select: {
          id: true,
          invoice: true,
          providerRefId: true,
          providerUpdatedAt: true,
        },
      });

    const results: Array<{
      invoice: string;
      providerStatus: string;
      refId?: string;
      rc?: string;
      message?: string;
      error?: string;
    }> = [];

    for (const order of pendingOrders) {
      try {
        /*
         * processDigiflazzOrder memakai
         * providerRefId / invoice yang sama.
         *
         * Jadi transaksi PENDING dicek
         * menggunakan ref_id yang sama,
         * bukan membuat transaksi baru.
         */
        const result =
          await processDigiflazzOrder(
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
          item.providerStatus ===
          "FAILED"
      ).length;

    return NextResponse.json({
      success: true,

      checked:
        pendingOrders.length,

      successCount,
      pendingCount,
      failedCount,

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
 * Vercel Cron memanggil endpoint
 * menggunakan GET.
 */
export async function GET(
  request: Request
) {
  return checkPendingOrders(request);
}

/*
 * POST tetap dipertahankan supaya
 * kita masih bisa menjalankan checker
 * secara manual dari PowerShell.
 */
export async function POST(
  request: Request
) {
  return checkPendingOrders(request);
}