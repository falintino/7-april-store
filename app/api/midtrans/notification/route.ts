import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { assertPaymentModesMatch } from "@/lib/digiflazz";
import { processOrderDelivery } from "@/lib/order-delivery";
import { getCustomerTotal } from "@/lib/payment-fees";
import { getDiamondAmount } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GrossAmountValue =
  | string
  | number;

type MidtransNotification = {
  order_id?: string;
  transaction_id?: string;
  transaction_status?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  payment_type?: string;
  fraud_status?: string;
  settlement_time?: string;

  extra_info?: {
    gross_amount_info?: {
      original_amount?: GrossAmountValue;
      gross_amount?: GrossAmountValue;
      customer_imposed_payment_fee?: GrossAmountValue;
    };
  };

  metadata?: {
    extra_info?: {
      gross_amount_info?: {
        original_amount?: GrossAmountValue;
        gross_amount?: GrossAmountValue;
        customer_imposed_payment_fee?: GrossAmountValue;
      };
    };
  };
};

function createMidtransSignature({
  orderId,
  statusCode,
  grossAmount,
  serverKey,
}: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey: string;
}) {
  return crypto
    .createHash("sha512")
    .update(
      `${orderId}${statusCode}${grossAmount}${serverKey}`
    )
    .digest("hex");
}

function determinePaymentStatus(
  transactionStatus: string,
  fraudStatus?: string
) {
  if (
    transactionStatus ===
    "settlement"
  ) {
    return "PAID";
  }

  if (
    transactionStatus ===
      "capture" &&
    (!fraudStatus ||
      fraudStatus === "accept")
  ) {
    return "PAID";
  }

  if (
    transactionStatus ===
    "pending"
  ) {
    return "PENDING";
  }

  if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel"
  ) {
    return "FAILED";
  }

  if (
    transactionStatus ===
    "expire"
  ) {
    return "EXPIRED";
  }

  if (
    transactionStatus ===
    "refund"
  ) {
    return "REFUNDED";
  }

  if (
    transactionStatus ===
    "partial_refund"
  ) {
    return "PARTIAL_REFUND";
  }

  return "PENDING";
}

/*
 * Jangan pernah membuat status pembayaran
 * mundur setelah sudah PAID.
 *
 * Contoh:
 *
 * PAID -> PENDING
 * PAID -> FAILED
 * PAID -> EXPIRED
 *
 * tidak diperbolehkan.
 *
 * Refund tetap diperbolehkan.
 */
function getStablePaymentStatus(
  currentStatus: string,
  incomingStatus: string
) {
  if (
    currentStatus ===
    "REFUNDED"
  ) {
    return "REFUNDED";
  }

  if (
    currentStatus ===
      "PARTIAL_REFUND" &&
    incomingStatus !==
      "REFUNDED"
  ) {
    return "PARTIAL_REFUND";
  }

  if (
    currentStatus ===
    "PAID"
  ) {
    if (
      incomingStatus ===
        "REFUNDED" ||
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

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return null;
  }

  return amount;
}

/*
 * =====================================
 * NORMALISASI PAYMENT METHOD
 * =====================================
 *
 * Di sisi checkout kita menggunakan:
 *
 * qris
 *
 * Sedangkan Midtrans dapat mengirim:
 *
 * other_qris
 *
 * Helper payment-fees menggunakan
 * "qris", jadi keduanya harus disamakan.
 */
function normalizePaymentMethodForFee(
  paymentType: string
) {
  if (
    paymentType ===
    "other_qris"
  ) {
    return "qris";
  }

  return paymentType;
}

export async function POST(
  request: Request
) {
  try {
    const notification =
      (await request.json()) as MidtransNotification;

    const orderId = String(
      notification.order_id ?? ""
    ).trim();

    const statusCode = String(
      notification.status_code ?? ""
    ).trim();

    /*
     * Penting:
     *
     * Simpan string gross_amount persis
     * seperti yang dikirim Midtrans.
     *
     * Nilai ini dipakai untuk signature.
     */
    const grossAmount = String(
      notification.gross_amount ?? ""
    ).trim();

    const signatureKey = String(
      notification.signature_key ?? ""
    ).trim();

    const transactionStatus =
      String(
        notification.transaction_status ??
          ""
      )
        .trim()
        .toLowerCase();

    const transactionId = String(
      notification.transaction_id ?? ""
    ).trim();

    const paymentType = String(
      notification.payment_type ?? ""
    ).trim();

    const fraudStatus =
      notification.fraud_status
        ? String(
            notification.fraud_status
          )
            .trim()
            .toLowerCase()
        : undefined;

    /*
     * =====================================
     * VALIDASI DASAR
     * =====================================
     */

    if (
      !orderId ||
      !statusCode ||
      !grossAmount ||
      !signatureKey ||
      !transactionStatus
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data notifikasi tidak lengkap.",
        },
        {
          status: 400,
        }
      );
    }

    const serverKey =
      process.env
        .MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      console.error(
        "MIDTRANS_SERVER_KEY belum dikonfigurasi."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Konfigurasi pembayaran belum lengkap.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =====================================
     * VERIFIKASI SIGNATURE MIDTRANS
     * =====================================
     */

    const expectedSignature =
      createMidtransSignature({
        orderId,
        statusCode,
        grossAmount,
        serverKey,
      });

    const expectedBuffer =
      Buffer.from(
        expectedSignature
      );

    const receivedBuffer =
      Buffer.from(
        signatureKey
      );

    const validSignature =
      expectedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!validSignature) {
      console.error(
        "MIDTRANS INVALID SIGNATURE:",
        orderId
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Signature tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * =====================================
     * VALIDASI MODE PEMBAYARAN
     * =====================================
     */

    try {
      assertPaymentModesMatch();
    } catch {
      console.error(
        "MIDTRANS NOTIFICATION: mode pembayaran tidak sesuai."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Konfigurasi mode pembayaran tidak sesuai.",
        },
        {
          status: 503,
        }
      );
    }

    /*
     * =====================================
     * AMBIL ORDER
     * =====================================
     */

    const order =
      await prisma.order.findUnique({
        where: {
          invoice:
            orderId,
        },

        include: {
          payment:
            true,

          promoCode:
            true,

          product:
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
     * =====================================
     * VERIFIKASI NOMINAL
     * =====================================
     *
     * order.total adalah harga produk
     * FINAL setelah diskon.
     */

    const midtransAmount =
      parseAmount(
        grossAmount
      );

    if (
      midtransAmount === null ||
      midtransAmount <= 0 ||
      !Number.isInteger(
        midtransAmount
      )
    ) {
      console.error(
        "MIDTRANS INVALID AMOUNT:",
        {
          invoice:
            order.invoice,

          grossAmount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Nominal pembayaran tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================
     * AUTOMATIC PAYMENT FEE INFO
     * =====================================
     *
     * Tetap dibaca untuk kompatibilitas
     * transaksi lama / bentuk notification
     * Midtrans tertentu.
     */

    const grossAmountInfo =
      notification
        .metadata
        ?.extra_info
        ?.gross_amount_info ??
      notification
        .extra_info
        ?.gross_amount_info;

    const originalAmountFromMidtrans =
      parseAmount(
        grossAmountInfo
          ?.original_amount
      );

    const grossAmountFromInfo =
      parseAmount(
        grossAmountInfo
          ?.gross_amount
      );

    const customerPaymentFee =
      parseAmount(
        grossAmountInfo
          ?.customer_imposed_payment_fee
      );

    /*
     * =====================================
     * PROMO BEBAS FEE
     * =====================================
     *
     * Kalau promo FREE_PAYMENT_FEE,
     * customer wajib membayar tepat
     * order.total.
     */

    if (
      order.paymentFeeWaived
    ) {
      if (
        midtransAmount !==
        order.total
      ) {
        console.error(
          "MIDTRANS PROMO AMOUNT MISMATCH:",
          {
            invoice:
              order.invoice,

            databaseTotal:
              order.total,

            midtransTotal:
              midtransAmount,
          }
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Nominal pembayaran promo tidak sesuai.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        originalAmountFromMidtrans !==
          null &&
        originalAmountFromMidtrans !==
          order.total
      ) {
        console.error(
          "MIDTRANS PROMO ORIGINAL AMOUNT MISMATCH:",
          {
            invoice:
              order.invoice,

            databaseTotal:
              order.total,

            originalAmount:
              originalAmountFromMidtrans,
          }
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Harga asli pembayaran tidak sesuai.",
          },
          {
            status: 400,
          }
        );
      }
    } else {
      /*
       * ===================================
       * HITUNG TOTAL YANG SEHARUSNYA
       * ===================================
       *
       * Sekarang fee QRIS ditambahkan
       * manual sebagai item Midtrans.
       *
       * Jadi notification Midtrans:
       *
       * gross_amount
       *
       * harus sama persis dengan:
       *
       * order.total + QRIS fee
       *
       * untuk 50+ DM.
       *
       * Untuk 1–49 DM:
       *
       * fee = 0
       *
       * sehingga:
       *
       * gross_amount = order.total
       */

      const normalizedPaymentMethod =
        normalizePaymentMethodForFee(
          paymentType
        );

      const diamondAmount =
        getDiamondAmount(
          order.product.name,
          order.product.sku
        );

      const expectedPayment =
        getCustomerTotal({
          productPrice:
            order.total,

          diamondAmount,

          paymentMethod:
            normalizedPaymentMethod,
        });

      const expectedCustomerTotal =
        expectedPayment.customerTotal;

      const expectedPaymentFee =
        expectedPayment.paymentFee;

      /*
       * ===================================
       * VALIDASI GROSS AMOUNT
       * ===================================
       */

      if (
        midtransAmount !==
        expectedCustomerTotal
      ) {
        console.error(
          "MIDTRANS CUSTOMER TOTAL MISMATCH:",
          {
            invoice:
              order.invoice,

            orderTotal:
              order.total,

            diamondAmount,

            paymentType,

            normalizedPaymentMethod,

            expectedPaymentFee,

            expectedCustomerTotal,

            midtransTotal:
              midtransAmount,
          }
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Nominal pembayaran tidak sesuai dengan harga pesanan.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * ===================================
       * VALIDASI INFO DARI MIDTRANS
       * ===================================
       *
       * Kalau Midtrans tetap mengirim
       * gross_amount_info, semua nilainya
       * harus tetap konsisten.
       */

      if (
        grossAmountInfo
      ) {
        if (
          originalAmountFromMidtrans ===
            null ||
          originalAmountFromMidtrans !==
            order.total
        ) {
          console.error(
            "MIDTRANS ORIGINAL AMOUNT MISMATCH:",
            {
              invoice:
                order.invoice,

              databaseTotal:
                order.total,

              originalAmount:
                originalAmountFromMidtrans,

              midtransTotal:
                midtransAmount,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Harga asli pembayaran tidak sesuai.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          grossAmountFromInfo !==
            null &&
          grossAmountFromInfo !==
            midtransAmount
        ) {
          console.error(
            "MIDTRANS GROSS AMOUNT INFO MISMATCH:",
            {
              invoice:
                order.invoice,

              notificationGross:
                midtransAmount,

              infoGross:
                grossAmountFromInfo,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Total pembayaran tidak konsisten.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          customerPaymentFee !==
            null &&
          customerPaymentFee < 0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Biaya pembayaran tidak valid.",
            },
            {
              status: 400,
            }
          );
        }
      }
    }

    /*
     * =====================================
     * STATUS PEMBAYARAN
     * =====================================
     */

    const incomingPaymentStatus =
      determinePaymentStatus(
        transactionStatus,
        fraudStatus
      );

    let paymentStatus =
      "PENDING";

    /*
     * =====================================
     * UPDATE ORDER + PAYMENT
     * =====================================
     */

    await prisma.$transaction(
      async (tx) => {
        /*
         * Lock row order agar webhook
         * yang datang bersamaan tidak
         * menyebabkan status / promo
         * diproses ganda.
         */

        await tx.$queryRaw`
          SELECT "id"
          FROM "Order"
          WHERE "invoice" = ${orderId}
          FOR UPDATE
        `;

        const lockedOrder =
          await tx.order.findUnique({
            where: {
              invoice:
                orderId,
            },

            include: {
              payment:
                true,

              promoCode:
                true,
            },
          });

        if (!lockedOrder) {
          throw new Error(
            "Order tidak ditemukan saat mengunci pembayaran."
          );
        }

        paymentStatus =
          getStablePaymentStatus(
            lockedOrder.paymentStatus,
            incomingPaymentStatus
          );

        await tx.order.update({
          where: {
            id:
              lockedOrder.id,
          },

          data: {
            paymentStatus,

            ...(paymentStatus ===
            "REFUNDED"
              ? {
                  providerStatus:
                    "REFUNDED",

                  providerMessage:
                    "Dana telah dikembalikan melalui Midtrans.",

                  providerUpdatedAt:
                    new Date(),
                }
              : paymentStatus ===
                "PARTIAL_REFUND"
                ? {
                    providerStatus:
                      "PARTIAL_REFUND",

                    providerMessage:
                      "Sebagian dana telah dikembalikan melalui Midtrans.",

                    providerUpdatedAt:
                      new Date(),
                  }
                : {}),

            paymentMethod:
              paymentType ||
              lockedOrder.paymentMethod,
          },
        });

        await tx.payment.upsert({
          where: {
            orderId:
              lockedOrder.id,
          },

          create: {
            orderId:
              lockedOrder.id,

            transactionId:
              transactionId ||
              null,

            paymentType:
              paymentType ||
              null,

            status:
              paymentStatus,

            grossAmount:
              midtransAmount,

            paidAt:
              paymentStatus ===
              "PAID"
                ? new Date()
                : null,
          },

          update: {
            transactionId:
              transactionId ||
              lockedOrder.payment
                ?.transactionId ||
              null,

            paymentType:
              paymentType ||
              lockedOrder.payment
                ?.paymentType ||
              null,

            status:
              paymentStatus,

            grossAmount:
              midtransAmount,

            paidAt:
              paymentStatus ===
              "PAID"
                ? lockedOrder
                    .payment
                    ?.paidAt ??
                  new Date()
                : lockedOrder
                    .payment
                    ?.paidAt ??
                  null,
          },
        });

        /*
         * ===================================
         * REDEEM PROMO SATU KALI
         * ===================================
         */

        if (
          paymentStatus ===
            "PAID" &&
          lockedOrder.promoCodeId
        ) {
          const promoClaim =
            await tx.order.updateMany({
              where: {
                id:
                  lockedOrder.id,

                promoCodeId:
                  lockedOrder.promoCodeId,

                promoRedeemedAt:
                  null,
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
                  lockedOrder.promoCodeId,
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

        maxWait:
          5000,

        timeout:
          10000,
      }
    );

    /*
     * =====================================
     * DIGIFLAZZ
     * =====================================
     *
     * Provider hanya dijalankan setelah
     * pembayaran benar-benar PAID.
     */

    let digiflazzResult:
      | Awaited<
          ReturnType<
            typeof processOrderDelivery
          >
        >
      | null = null;

    if (
      paymentStatus ===
      "PAID"
    ) {
      try {
        digiflazzResult =
          await processOrderDelivery(
            order.id
          );
      } catch (error) {
        /*
         * Error Digiflazz tidak boleh
         * membatalkan pembayaran.
         */

        console.error(
          "DIGIFLAZZ PROCESS ERROR:",
          {
            invoice:
              order.invoice,

            error:
              error instanceof Error
                ? error.message
                : error,
          }
        );
      }
    }

    /*
     * =====================================
     * LOG
     * =====================================
     */

    console.log(
      "MIDTRANS NOTIFICATION SUCCESS:",
      {
        invoice:
          order.invoice,

        transactionStatus,

        incomingPaymentStatus,

        paymentStatus,

        originalAmount:
          order.total,

        grossAmount:
          midtransAmount,

        customerPaymentFee,

        paymentFeeWaived:
          order.paymentFeeWaived,

        providerStatus:
          digiflazzResult
            ?.providerStatus,

        providerRefId:
          digiflazzResult
            ?.refId,

        providerRc:
          digiflazzResult
            ?.rc,
      }
    );

    /*
     * =====================================
     * RESPONSE KE MIDTRANS
     * =====================================
     */

    return NextResponse.json({
      success: true,

      message:
        "Notifikasi berhasil diproses.",

      paymentStatus,

      providerStatus:
        digiflazzResult
          ?.providerStatus ??
        null,

      providerRefId:
        digiflazzResult
          ?.refId ??
        null,
    });
  } catch (error) {
    console.error(
      "MIDTRANS NOTIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan saat memproses notifikasi.",
      },
      {
        status: 500,
      }
    );
  }
}