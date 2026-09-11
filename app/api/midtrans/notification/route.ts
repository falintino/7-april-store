import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { assertPaymentModesMatch } from "@/lib/digiflazz";
import { processOrderDelivery } from "@/lib/order-delivery";

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
     * AMBIL ORDER
     * =====================================
     */

    // Konfigurasi keliru ditolak sebelum status pembayaran diubah.
    // HTTP 503 membuat kegagalan ini terlihat, bukan diakui sebagai sukses.
    try {
      assertPaymentModesMatch();
    } catch {
      console.error("MIDTRANS NOTIFICATION: mode pembayaran tidak sesuai.");
      return NextResponse.json(
        { success: false, message: "Konfigurasi mode pembayaran tidak sesuai." },
        { status: 503 }
      );
    }

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
     * order.total sekarang adalah
     * harga produk FINAL.
     *
     * Jika tidak ada diskon:
     *
     * subtotal = total.
     *
     * Jika ada FIXED_DISCOUNT atau
     * PERCENT_DISCOUNT:
     *
     * total =
     * subtotal - discountAmount.
     *
     * Nilai inilah yang menjadi
     * original_amount di Midtrans.
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
     * Midtrans dapat mengirim data ini
     * melalui dua bentuk:
     *
     * metadata.extra_info.gross_amount_info
     *
     * atau:
     *
     * extra_info.gross_amount_info
     *
     * Keduanya tetap didukung.
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
     * ORDER PAKAI PROMO BEBAS FEE
     * =====================================
     *
     * paymentFeeWaived = true
     *
     * berarti customer harus membayar
     * persis order.total.
     *
     * Promo ini tidak memberikan diskon
     * terhadap harga produk.
     *
     * Yang dihapus hanya biaya pembayaran
     * yang biasanya dibebankan kepada
     * customer.
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

      /*
       * Kalau Midtrans mengirim
       * original_amount juga,
       * nilainya harus cocok.
       */

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
       * ORDER NORMAL + AUTOMATIC FEE
       * ===================================
       *
       * Bagian ini berlaku untuk:
       *
       * - order tanpa promo
       * - FIXED_DISCOUNT
       * - PERCENT_DISCOUNT
       *
       * Untuk promo diskon produk,
       * order.total sudah merupakan
       * harga SETELAH diskon.
       *
       * Bila extra_info tersedia,
       * original_amount harus sama dengan
       * order.total.
       *
       * gross_amount boleh lebih besar
       * karena sudah termasuk fee.
       */

      if (grossAmountInfo) {
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

        /*
         * gross_amount pada extra_info
         * jika tersedia harus cocok dengan
         * gross_amount utama notification.
         */

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

        /*
         * Payment fee tidak boleh negatif.
         */

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

        /*
         * Setelah fee ditambahkan,
         * customer tidak boleh membayar
         * lebih rendah daripada harga
         * produk FINAL.
         *
         * Untuk order promo diskon:
         *
         * order.total sudah merupakan
         * harga setelah diskon.
         */

        if (
          midtransAmount <
          order.total
        ) {
          console.error(
            "MIDTRANS TOTAL BELOW ORIGINAL:",
            {
              invoice:
                order.invoice,

              original:
                order.total,

              gross:
                midtransAmount,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Total pembayaran lebih rendah dari harga produk.",
            },
            {
              status: 400,
            }
          );
        }
      } else {
        /*
         * Fallback untuk transaksi lama
         * atau transaksi yang ternyata
         * tidak mendapat Automatic Fee.
         *
         * Tanpa gross_amount_info kita
         * hanya menerima nominal yang
         * persis sama dengan order.total.
         *
         * Kalau jumlahnya lebih besar,
         * kita tidak punya bukti aman
         * bahwa selisih tersebut benar
         * berasal dari fee Midtrans.
         */

        if (
          midtransAmount !==
          order.total
        ) {
          console.error(
            "MIDTRANS AMOUNT WITHOUT FEE INFO MISMATCH:",
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
                "Informasi nominal pembayaran tidak lengkap.",
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

    // Diisi dari status terbaru setelah row lock diperoleh.
    let paymentStatus = "PENDING";

    /*
     * =====================================
     * UPDATE ORDER + PAYMENT
     * =====================================
     */

    await prisma.$transaction(
      async (tx) => {
        // Query berparameter; invoice tidak digabungkan ke string SQL.
        // Notifikasi untuk invoice yang sama menunggu giliran sampai commit.
        await tx.$queryRaw`
          SELECT "id" FROM "Order"
          WHERE "invoice" = ${orderId}
          FOR UPDATE
        `;

        const order = await tx.order.findUnique({
          where: { invoice: orderId },
          include: { payment: true, promoCode: true },
        });

        if (!order) {
          throw new Error("Order tidak ditemukan saat mengunci pembayaran.");
        }

        paymentStatus = getStablePaymentStatus(
          order.paymentStatus,
          incomingPaymentStatus
        );

        await tx.order.update({
          where: {
            id:
              order.id,
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
            orderId:
              order.id,
          },

          create: {
            orderId:
              order.id,

            transactionId:
              transactionId ||
              null,

            paymentType:
              paymentType ||
              null,

            status:
              paymentStatus,

            /*
             * Simpan TOTAL yang benar-benar
             * ditagihkan Midtrans.
             *
             * Normal:
             *
             * harga produk + payment fee.
             *
             * FIXED/PERCENT:
             *
             * harga produk setelah diskon
             * + payment fee.
             *
             * FREE_PAYMENT_FEE:
             *
             * harga produk saja.
             */

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
              order.payment
                ?.transactionId ||
              null,

            paymentType:
              paymentType ||
              order.payment
                ?.paymentType ||
              null,

            status:
              paymentStatus,

            grossAmount:
              midtransAmount,

            /*
             * paidAt tidak boleh hilang
             * karena webhook duplikat.
             */

            paidAt:
              paymentStatus ===
              "PAID"
                ? order.payment
                    ?.paidAt ??
                  new Date()
                : order.payment
                    ?.paidAt ??
                  null,
          },
        });

        /*
         * ===================================
         * REDEEM PROMO TEPAT SATU KALI
         * ===================================
         *
         * Berlaku untuk SEMUA jenis promo:
         *
         * - FREE_PAYMENT_FEE
         * - FIXED_DISCOUNT
         * - PERCENT_DISCOUNT
         *
         * Promo hanya dihitung sebagai
         * penggunaan setelah pembayaran
         * benar-benar PAID.
         *
         * promoRedeemedAt bertindak sebagai
         * atomic claim:
         *
         * null -> waktu sekarang
         *
         * Webhook PAID kedua untuk order
         * yang sama tidak dapat claim lagi.
         *
         * Karena itu usedCount hanya
         * bertambah SATU KALI per order.
         */

        if (
          paymentStatus ===
            "PAID" &&
          order.promoCodeId
        ) {
          const promoClaim =
            await tx.order.updateMany({
              where: {
                id:
                  order.id,

                promoCodeId:
                  order.promoCodeId,

                /*
                 * PENTING:
                 *
                 * Tidak ada lagi syarat:
                 *
                 * paymentFeeWaived: true
                 *
                 * Karena FIXED_DISCOUNT
                 * dan PERCENT_DISCOUNT
                 * memang menggunakan
                 * paymentFeeWaived = false.
                 */

                promoRedeemedAt:
                  null,
              },

              data: {
                promoRedeemedAt:
                  new Date(),
              },
            });

          /*
           * Hanya proses yang berhasil
           * claim promoRedeemedAt yang
           * boleh menaikkan usedCount.
           */

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
      { isolationLevel: "ReadCommitted", maxWait: 5000, timeout: 10000 }
    );

    /*
     * =====================================
     * DIGIFLAZZ
     * =====================================
     *
     * Provider hanya berjalan setelah PAID.
     *
     * Perubahan sistem promo tidak boleh
     * membuat Digiflazz berjalan sebelum
     * pembayaran berhasil.
     */

    let digiflazzResult:
      | Awaited<
          ReturnType<
            typeof processDigiflazzOrder
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
     * Jangan log kode promo ataupun
     * Midtrans Server Key.
     */

    console.log(
      "MIDTRANS NOTIFICATION SUCCESS:",
      {
        invoice:
          order.invoice,

        transactionStatus,

        incomingPaymentStatus,

        paymentStatus,

        /*
         * order.total adalah harga produk
         * FINAL setelah diskon.
         */

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
     * Midtrans harus menerima HTTP 200
     * setelah notification berhasil
     * diterima dan diproses.
     *
     * Error provider tidak membuat
     * webhook pembayaran gagal.
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
