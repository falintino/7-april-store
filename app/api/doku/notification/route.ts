import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  assertPaymentModesMatch,
  processDigiflazzOrder,
} from "@/lib/digiflazz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DokuNotification = {
  service?: {
    id?: string;
  };

  acquirer?: {
    id?: string;
  };

  channel?: {
    id?: string;
  };

  order?: {
    invoice_number?: string;
    amount?: string | number;
  };

  transaction?: {
    status?: string;
    date?: string;
    original_request_id?: string;
  };
};

function createDigest(rawBody: string) {
  return createHash("sha256")
    .update(rawBody)
    .digest("base64");
}

function createDokuSignature({
  clientId,
  requestId,
  requestTimestamp,
  requestTarget,
  digest,
  secretKey,
}: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  digest: string;
  secretKey: string;
}) {
  const signatureComponent = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`,
  ].join("\n");

  const signature = createHmac(
    "sha256",
    secretKey
  )
    .update(signatureComponent)
    .digest("base64");

  return `HMACSHA256=${signature}`;
}

function signaturesMatch(
  receivedSignature: string,
  expectedSignature: string
) {
  const receivedBuffer = Buffer.from(
    receivedSignature
  );

  const expectedBuffer = Buffer.from(
    expectedSignature
  );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}

function determinePaymentStatus(
  transactionStatus: string
) {
  const status =
    transactionStatus
      .trim()
      .toUpperCase();

  if (
    status === "SUCCESS" ||
    status === "SETTLEMENT" ||
    status === "CAPTURE"
  ) {
    return "PAID";
  }

  if (
    status === "FAILED" ||
    status === "DENIED" ||
    status === "CANCELLED" ||
    status === "CANCELED"
  ) {
    return "FAILED";
  }

  if (
    status === "EXPIRED" ||
    status === "EXPIRE"
  ) {
    return "EXPIRED";
  }

  if (
    status === "REFUNDED" ||
    status === "REFUND"
  ) {
    return "REFUNDED";
  }

  if (
    status === "PARTIAL_REFUND" ||
    status === "PARTIALLY_REFUNDED"
  ) {
    return "PARTIAL_REFUND";
  }

  return "PENDING";
}

function getStablePaymentStatus(
  currentStatus: string,
  incomingStatus: string
) {
  if (currentStatus === "REFUNDED") {
    return "REFUNDED";
  }

  if (
    currentStatus ===
      "PARTIAL_REFUND" &&
    incomingStatus !== "REFUNDED"
  ) {
    return "PARTIAL_REFUND";
  }

  if (currentStatus === "PAID") {
    if (
      incomingStatus === "REFUNDED" ||
      incomingStatus ===
        "PARTIAL_REFUND"
    ) {
      return incomingStatus;
    }

    return "PAID";
  }

  return incomingStatus;
}

function parseAmount(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    return null;
  }

  return amount;
}

export async function POST(request: Request) {
  try {
    const secretKey =
      process.env.DOKU_SECRET_KEY?.trim();

    const configuredClientId =
      process.env.DOKU_CLIENT_ID?.trim();

    if (
      !secretKey ||
      !configuredClientId
    ) {
      console.error(
        "DOKU CREDENTIALS NOT CONFIGURED"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Credential DOKU belum dikonfigurasi.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Body harus dibaca sebagai teks terlebih
     * dahulu karena teks asli digunakan untuk
     * menghitung Digest signature DOKU.
     */
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Body notifikasi kosong.",
        },
        {
          status: 400,
        }
      );
    }

    const clientId =
      request.headers
        .get("client-id")
        ?.trim() ?? "";

    const requestId =
      request.headers
        .get("request-id")
        ?.trim() ?? "";

    const requestTimestamp =
      request.headers
        .get("request-timestamp")
        ?.trim() ?? "";

    const receivedSignature =
      request.headers
        .get("signature")
        ?.trim() ?? "";

    if (
      !clientId ||
      !requestId ||
      !requestTimestamp ||
      !receivedSignature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Header notifikasi DOKU tidak lengkap.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      clientId !== configuredClientId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Client ID DOKU tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    const requestTarget =
      "/api/doku/notification";

    const digest =
      createDigest(rawBody);

    const expectedSignature =
      createDokuSignature({
        clientId,
        requestId,
        requestTimestamp,
        requestTarget,
        digest,
        secretKey,
      });

    if (
      !signaturesMatch(
        receivedSignature,
        expectedSignature
      )
    ) {
      console.error(
        "DOKU INVALID SIGNATURE:",
        {
          requestId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Signature DOKU tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    let notification:
      DokuNotification;

    try {
      notification =
        JSON.parse(
          rawBody
        ) as DokuNotification;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format JSON tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const invoice = String(
      notification.order
        ?.invoice_number ?? ""
    ).trim();

    const dokuAmount =
      parseAmount(
        notification.order?.amount
      );

    const transactionStatus =
      String(
        notification.transaction
          ?.status ?? ""
      )
        .trim()
        .toUpperCase();

    const transactionId =
      String(
        notification.transaction
          ?.original_request_id ||
          requestId
      ).trim();

    const paymentType =
      String(
        notification.channel?.id ||
        notification.service?.id ||
        "doku_checkout"
      ).trim();

    if (
      !invoice ||
      dokuAmount === null ||
      !transactionStatus
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data notifikasi DOKU tidak lengkap.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Memastikan mode pembayaran aplikasi
     * dan database sudah sesuai.
     */
    try {
      assertPaymentModesMatch();
    } catch (error) {
      console.error(
        "PAYMENT MODE MISMATCH:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Konfigurasi pembayaran tidak sesuai.",
        },
        {
          status: 500,
        }
      );
    }

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          invoice,
        },

        include: {
          payment: true,
          promoCode: true,
        },
      });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pesanan tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Nominal dari DOKU wajib sama dengan
     * total yang tersimpan di database.
     */
    if (
      dokuAmount !== existingOrder.total
    ) {
      console.error(
        "DOKU AMOUNT MISMATCH:",
        {
          invoice,
          databaseAmount:
            existingOrder.total,
          dokuAmount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Nominal pembayaran tidak sesuai.",
        },
        {
          status: 400,
        }
      );
    }

    const incomingPaymentStatus =
      determinePaymentStatus(
        transactionStatus
      );

    let paymentStatus = "PENDING";

    /*
     * Mengunci order agar webhook ganda
     * tidak menjalankan pencatatan promo
     * lebih dari satu kali.
     */
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT "id"
          FROM "Order"
          WHERE "invoice" = ${invoice}
          FOR UPDATE
        `;

        const order =
          await tx.order.findUnique({
            where: {
              invoice,
            },

            include: {
              payment: true,
              promoCode: true,
            },
          });

        if (!order) {
          throw new Error(
            "Order tidak ditemukan saat dikunci."
          );
        }

        paymentStatus =
          getStablePaymentStatus(
            order.paymentStatus,
            incomingPaymentStatus
          );

        await tx.order.update({
          where: {
            id: order.id,
          },

          data: {
            paymentStatus,
            paymentMethod:
              paymentType ||
              order.paymentMethod,
          },
        });

        await tx.payment.upsert({
          where: {
            orderId: order.id,
          },

          create: {
            orderId: order.id,
            transactionId,
            paymentType,
            status: paymentStatus,
            grossAmount: dokuAmount,

            paidAt:
              paymentStatus === "PAID"
                ? new Date()
                : null,
          },

          update: {
            transactionId:
              transactionId ||
              order.payment
                ?.transactionId ||
              null,

            paymentType:
              paymentType ||
              order.payment
                ?.paymentType ||
              null,

            status: paymentStatus,
            grossAmount: dokuAmount,

            paidAt:
              paymentStatus === "PAID"
                ? order.payment?.paidAt ??
                  new Date()
                : order.payment?.paidAt ??
                  null,
          },
        });

        /*
         * Promo dicatat tepat satu kali
         * setelah pembayaran benar-benar PAID.
         */
        if (
          paymentStatus === "PAID" &&
          order.promoCodeId
        ) {
          const promoClaim =
            await tx.order.updateMany({
              where: {
                id: order.id,

                promoCodeId:
                  order.promoCodeId,

                promoRedeemedAt: null,
              },

              data: {
                promoRedeemedAt:
                  new Date(),
              },
            });

          if (
            promoClaim.count === 1
          ) {
            await tx.promoCode.update({
              where: {
                id:
                  order.promoCodeId,
              },

              data: {
                usedCount: {
                  increment: 1,
                },
              },
            });
          }
        }
      },
      {
        isolationLevel:
          "ReadCommitted",

        maxWait: 5000,
        timeout: 10000,
      }
    );

    /*
     * Digiflazz hanya dijalankan setelah
     * pembayaran DOKU berhasil.
     */
    let digiflazzResult:
      | Awaited<
          ReturnType<
            typeof processDigiflazzOrder
          >
        >
      | null = null;

    if (paymentStatus === "PAID") {
      try {
        digiflazzResult =
          await processDigiflazzOrder(
            existingOrder.id
          );
      } catch (error) {
        /*
         * Kegagalan Digiflazz tidak boleh
         * membatalkan pembayaran pelanggan.
         */
        console.error(
          "DOKU DIGIFLAZZ PROCESS ERROR:",
          {
            invoice,
            error:
              error instanceof Error
                ? error.message
                : error,
          }
        );
      }
    }

    console.log(
      "DOKU NOTIFICATION SUCCESS:",
      {
        invoice,
        transactionStatus,
        paymentStatus,
        paymentType,
        digiflazzProcessed:
          digiflazzResult !== null,
      }
    );

    /*
     * DOKU membutuhkan respons HTTP 200
     * agar notifikasi dianggap diterima.
     */
    return NextResponse.json({
      success: true,
      invoice,
      paymentStatus,
    });
  } catch (error) {
    console.error(
      "DOKU NOTIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat memproses notifikasi DOKU.",
      },
      {
        status: 500,
      }
    );
  }
}