import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PaymentMethod =
  | "qris"
  | "gopay"
  | "dana"
  | "ovo"
  | "shopeepay"
  | "bca_va"
  | "bni_va"
  | "bri_va"
  | "permata_va"
  | "mandiri_va";

type MidtransResponse = {
  token?: string;
  redirect_url?: string;
  error_messages?: string[];
};

const FREE_PAYMENT_FEE =
  "FREE_PAYMENT_FEE";

const FIXED_DISCOUNT =
  "FIXED_DISCOUNT";

const PERCENT_DISCOUNT =
  "PERCENT_DISCOUNT";

const paymentMethodMap: Record<
  PaymentMethod,
  string
> = {
  qris: "other_qris",
  gopay: "gopay",
  dana: "dana",
  ovo: "ovo",
  shopeepay: "shopeepay",
  bca_va: "bca_va",
  bni_va: "bni_va",
  bri_va: "bri_va",
  permata_va: "permata_va",
  mandiri_va: "echannel",
};

const BANK_VA_MINIMUM =
  50_000;

const bankTransferMethods =
  new Set<PaymentMethod>([
    "bca_va",
    "bni_va",
    "bri_va",
    "permata_va",
    "mandiri_va",
  ]);

function isPaymentMethod(
  value: string
): value is PaymentMethod {
  return value in paymentMethodMap;
}

function getAppUrl() {
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    return "http://localhost:3000";
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://7-april-store.vercel.app"
  ).replace(/\/$/, "");
}

function normalizeWhatsapp(
  value: string
) {
  return value
    .replace(/\D/g, "")
    .trim();
}

/*
 * =========================================
 * HITUNG DISKON PRODUK
 * =========================================
 */

function calculateDiscount({
  promoType,
  discountValue,
  maxDiscount,
  subtotal,
}: {
  promoType: string;
  discountValue: number | null;
  maxDiscount: number | null;
  subtotal: number;
}) {
  /*
   * FIXED DISCOUNT
   */

  if (
    promoType ===
    FIXED_DISCOUNT
  ) {
    if (
      discountValue === null ||
      !Number.isInteger(
        discountValue
      ) ||
      discountValue <= 0
    ) {
      return null;
    }

    return discountValue;
  }

  /*
   * PERCENT DISCOUNT
   */

  if (
    promoType ===
    PERCENT_DISCOUNT
  ) {
    if (
      discountValue === null ||
      !Number.isInteger(
        discountValue
      ) ||
      discountValue <= 0 ||
      discountValue > 100
    ) {
      return null;
    }

    const percentageDiscount =
      Math.floor(
        (subtotal *
          discountValue) /
          100
      );

    if (
      percentageDiscount <= 0
    ) {
      return null;
    }

    if (
      maxDiscount !== null
    ) {
      if (
        !Number.isInteger(
          maxDiscount
        ) ||
        maxDiscount <= 0
      ) {
        return null;
      }

      return Math.min(
        percentageDiscount,
        maxDiscount
      );
    }

    return percentageDiscount;
  }

  return null;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const invoice = String(
      body.invoice ?? ""
    ).trim();

    const paymentMethod =
      String(
        body.paymentMethod ?? ""
      ).trim();

    const promoCodeInput =
      String(
        body.promoCode ?? ""
      ).trim();

    /*
     * =========================================
     * VALIDASI INPUT
     * =========================================
     */

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invoice wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !paymentMethod ||
      !isPaymentMethod(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Metode pembayaran tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * KONFIGURASI MIDTRANS
     * =========================================
     */

    const serverKey =
      process.env
        .MIDTRANS_SERVER_KEY;

    const isProduction =
      process.env
        .MIDTRANS_IS_PRODUCTION ===
      "true";

    if (!serverKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =========================================
     * AMBIL ORDER
     * =========================================
     */

    let order =
      await prisma.order.findUnique({
        where: {
          invoice,
        },

        include: {
          product: true,
          payment: true,
          promoCode: true,
        },
      });

    if (!order) {
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

    if (
      order.paymentStatus ===
      "PAID"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pesanan ini sudah dibayar.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * SNAPSHOT HARGA ORDER
     * =========================================
     */

    const baseSubtotal =
      order.subtotal ??
      order.total;

    if (
      !Number.isInteger(
        baseSubtotal
      ) ||
      baseSubtotal <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Harga pesanan tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =========================================
     * SNAPSHOT MODAL PROVIDER
     * =========================================
     */

    const providerCost =
      order.providerPriceSnapshot ??
      order.product.providerPrice;

    if (
      !Number.isInteger(
        providerCost
      ) ||
      providerCost <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Harga provider tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =========================================
     * CUSTOMER
     * =========================================
     *
     * Nomor WhatsApp yang digunakan untuk
     * validasi promo berasal dari ORDER.
     *
     * Browser tidak boleh menentukan nomor
     * lain ketika checkout.
     */

    const customerWhatsapp =
      normalizeWhatsapp(
        order.whatsapp
      );

    /*
     * =========================================
     * PROMO
     * =========================================
     */

    let paymentFeeWaived =
      order.paymentFeeWaived;

    /*
     * =========================================
     * ORDER SUDAH MEMILIKI PROMO
     * =========================================
     */

    if (
      order.promoCodeId
    ) {
      /*
       * Promo tidak boleh diganti setelah
       * ditempelkan ke order.
       */

      if (
        promoCodeInput &&
        order.promoCode &&
        promoCodeInput
          .toLowerCase() !==
          order.promoCode.code
            .toLowerCase()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Pesanan ini sudah menggunakan kode promo lain.",
          },
          {
            status: 400,
          }
        );
      }

      paymentFeeWaived =
        order.paymentFeeWaived;
    } else if (
      promoCodeInput
    ) {
      /*
       * =========================================
       * AMBIL PROMO
       * =========================================
       */

      const promo =
        await prisma.promoCode
          .findFirst({
            where: {
              code: {
                equals:
                  promoCodeInput,

                mode:
                  "insensitive",
              },
            },
          });

      if (!promo) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Kode promo tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * =========================================
       * STATUS PROMO
       * =========================================
       */

      if (!promo.active) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Kode promo sudah tidak aktif.",
          },
          {
            status: 400,
          }
        );
      }

      const now =
        new Date();

      /*
       * =========================================
       * TANGGAL MULAI
       * =========================================
       */

      if (
        promo.startsAt &&
        promo.startsAt.getTime() >
          now.getTime()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promo belum mulai.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * =========================================
       * EXPIRED
       * =========================================
       */

      if (
        promo.expiresAt &&
        promo.expiresAt.getTime() <=
          now.getTime()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Kode promo sudah kedaluwarsa.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * =========================================
       * KUOTA GLOBAL
       * =========================================
       */

      if (
        promo.maxUses !== null
      ) {
        if (
          !Number.isInteger(
            promo.maxUses
          ) ||
          promo.maxUses <= 0
        ) {
          console.error(
            "MIDTRANS PROMO INVALID MAX USES:",
            {
              promoId:
                promo.id,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Konfigurasi promo tidak valid.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          promo.usedCount >=
          promo.maxUses
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Batas penggunaan kode promo sudah habis.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * =========================================
       * TARGET PRODUK
       * =========================================
       */

      if (
        promo.productId !== null &&
        promo.productId !==
          order.productId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promo ini tidak berlaku untuk nominal yang dipilih.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * =========================================
       * CUSTOMER-BASED PROMO
       * =========================================
       */

      const requiresCustomer =
        promo.maxUsesPerCustomer !==
          null ||
        promo.firstOrderOnly ||
        promo.minCompletedOrders !==
          null;

      if (
        requiresCustomer &&
        !/^\d{10,15}$/.test(
          customerWhatsapp
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Nomor WhatsApp pada pesanan tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      let completedOrders = 0;

      if (requiresCustomer) {
        completedOrders =
          await prisma.order.count({
            where: {
              whatsapp:
                customerWhatsapp,

              paymentStatus:
                "PAID",
            },
          });
      }

      /*
       * =========================================
       * FIRST ORDER ONLY
       * =========================================
       */

      if (
        promo.firstOrderOnly &&
        completedOrders > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promo ini hanya berlaku untuk pembelian pertama.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * =========================================
       * LOYAL CUSTOMER
       * =========================================
       */

      if (
        promo.minCompletedOrders !==
        null
      ) {
        if (
          !Number.isInteger(
            promo.minCompletedOrders
          ) ||
          promo.minCompletedOrders <
            0
        ) {
          console.error(
            "MIDTRANS PROMO INVALID MIN COMPLETED ORDERS:",
            {
              promoId:
                promo.id,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Konfigurasi promo tidak valid.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          completedOrders <
          promo.minCompletedOrders
        ) {
          return NextResponse.json(
            {
              success: false,

              message:
                `Promo ini khusus pelanggan yang sudah melakukan minimal ${promo.minCompletedOrders} transaksi berhasil.`,
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * =========================================
       * BATAS PER CUSTOMER
       * =========================================
       */

      if (
        promo.maxUsesPerCustomer !==
        null
      ) {
        if (
          !Number.isInteger(
            promo.maxUsesPerCustomer
          ) ||
          promo.maxUsesPerCustomer <=
            0
        ) {
          console.error(
            "MIDTRANS PROMO INVALID MAX USES PER CUSTOMER:",
            {
              promoId:
                promo.id,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Konfigurasi promo tidak valid.",
            },
            {
              status: 400,
            }
          );
        }

        const customerPromoUses =
          await prisma.order.count({
            where: {
              whatsapp:
                customerWhatsapp,

              promoCodeId:
                promo.id,

              paymentStatus:
                "PAID",

              promoRedeemedAt: {
                not: null,
              },
            },
          });

        if (
          customerPromoUses >=
          promo.maxUsesPerCustomer
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Batas penggunaan promo untuk akun ini sudah habis.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * =========================================
       * MINIMUM ORDER
       * =========================================
       *
       * Berlaku untuk SEMUA jenis promo.
       */

      if (
        promo.minOrder !== null
      ) {
        if (
          !Number.isInteger(
            promo.minOrder
          ) ||
          promo.minOrder < 0
        ) {
          console.error(
            "MIDTRANS PROMO INVALID MIN ORDER:",
            {
              promoId:
                promo.id,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Konfigurasi promo tidak valid.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          baseSubtotal <
          promo.minOrder
        ) {
          return NextResponse.json(
            {
              success: false,

              message:
                `Promo berlaku untuk pembelian minimal Rp${promo.minOrder.toLocaleString(
                  "id-ID"
                )}.`,
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * =========================================
       * FREE PAYMENT FEE
       * =========================================
       */

      if (
        promo.type ===
        FREE_PAYMENT_FEE
      ) {
        order =
          await prisma.order.update({
            where: {
              id: order.id,
            },

            data: {
              subtotal:
                baseSubtotal,

              discountAmount:
                0,

              total:
                baseSubtotal,

              promoCodeId:
                promo.id,

              paymentFeeWaived:
                true,

              promoAppliedAt:
                new Date(),
            },

            include: {
              product: true,
              payment: true,
              promoCode: true,
            },
          });

        paymentFeeWaived =
          true;
      } else if (
        promo.type ===
          FIXED_DISCOUNT ||
        promo.type ===
          PERCENT_DISCOUNT
      ) {
        /*
         * =========================================
         * HITUNG DISKON
         * =========================================
         */

        const discountAmount =
          calculateDiscount({
            promoType:
              promo.type,

            discountValue:
              promo.discountValue,

            maxDiscount:
              promo.maxDiscount,

            subtotal:
              baseSubtotal,
          });

        if (
          discountAmount === null ||
          !Number.isInteger(
            discountAmount
          ) ||
          discountAmount <= 0
        ) {
          console.error(
            "MIDTRANS PROMO INVALID DISCOUNT:",
            {
              promoId:
                promo.id,

              promoType:
                promo.type,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Konfigurasi diskon promo tidak valid.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          discountAmount >=
          baseSubtotal
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Diskon promo terlalu besar untuk pesanan ini.",
            },
            {
              status: 400,
            }
          );
        }

        /*
         * =========================================
         * TOTAL SETELAH DISKON
         * =========================================
         */

        const finalTotal =
          baseSubtotal -
          discountAmount;

        /*
         * =========================================
         * MINIMUM MARGIN
         * =========================================
         */

        if (
          !Number.isInteger(
            promo.minimumMargin
          ) ||
          promo.minimumMargin < 0
        ) {
          console.error(
            "MIDTRANS PROMO INVALID MINIMUM MARGIN:",
            {
              promoId:
                promo.id,
            }
          );

          return NextResponse.json(
            {
              success: false,
              message:
                "Konfigurasi margin promo tidak valid.",
            },
            {
              status: 400,
            }
          );
        }

        /*
         * =========================================
         * PENGAMAN PROFIT
         * =========================================
         *
         * providerCost berasal dari snapshot
         * order, bukan browser.
         */

        const minimumAllowedPrice =
          providerCost +
          promo.minimumMargin;

        if (
          finalTotal <
          minimumAllowedPrice
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Promo ini tidak dapat digunakan untuk nominal yang dipilih.",
            },
            {
              status: 400,
            }
          );
        }

        /*
         * =========================================
         * TEMPEL PROMO
         * =========================================
         */

        order =
          await prisma.order.update({
            where: {
              id: order.id,
            },

            data: {
              subtotal:
                baseSubtotal,

              discountAmount,

              total:
                finalTotal,

              promoCodeId:
                promo.id,

              paymentFeeWaived:
                false,

              promoAppliedAt:
                new Date(),
            },

            include: {
              product: true,
              payment: true,
              promoCode: true,
            },
          });

        paymentFeeWaived =
          false;
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "Jenis kode promo tidak didukung.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * =========================================
     * VALIDASI TOTAL FINAL
     * =========================================
     */

    if (
      !Number.isInteger(
        order.total
      ) ||
      order.total <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Total pembayaran tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =========================================
     * BATAS MINIMAL BANK / VA
     * =========================================
     *
     * Diperiksa SETELAH diskon.
     */

    if (
      bankTransferMethods.has(
        paymentMethod
      ) &&
      order.total <
        BANK_VA_MINIMUM
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Bank Transfer / Virtual Account tersedia untuk transaksi minimal Rp50.000. Silakan gunakan QRIS atau e-wallet.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * MIDTRANS
     * =========================================
     */

    const originalAmount =
      order.total;

    const midtransOrderId =
      order.invoice;

    const endpoint =
      isProduction
        ? "https://app.midtrans.com/snap/v1/transactions"
        : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authorization =
      Buffer.from(
        `${serverKey}:`
      ).toString("base64");

    const enabledPayment =
      paymentMethodMap[
        paymentMethod
      ];

    /*
     * =========================================
     * QRIS AUTOMATIC FEE FIX
     * =========================================
     *
     * enabled_payments:
     * other_qris
     *
     * payment_fee_configs:
     * gopay
     */

    const paymentFeeType =
      paymentMethod === "qris"
        ? "gopay"
        : enabledPayment;

    const appUrl =
      getAppUrl();

    const finishUrl =
      `${appUrl}/payment/finish`;

    /*
     * =========================================
     * AUTOMATIC PAYMENT FEE
     * =========================================
     */

    const customerImposedPaymentFee =
      paymentFeeWaived
        ? {
            enable: false,
          }
        : {
            enable: true,

            payment_fee_configs: [
              {
                payment_type:
                  paymentFeeType,

                customer_percentage:
                  100,
              },
            ],
          };

    /*
     * =========================================
     * BUAT TRANSAKSI MIDTRANS
     * =========================================
     */

    const midtransResponse =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Basic ${authorization}`,
          },

          body:
            JSON.stringify({
              transaction_details: {
                order_id:
                  midtransOrderId,

                gross_amount:
                  originalAmount,
              },

              item_details: [
                {
                  id:
                    order.product
                      .sku,

                  price:
                    originalAmount,

                  quantity: 1,

                  name:
                    order.product
                      .name
                      .substring(
                        0,
                        50
                      ),
                },
              ],

              customer_details: {
                first_name:
                  "Pelanggan 7 April Store",

                phone:
                  order.whatsapp,
              },

              enabled_payments: [
                enabledPayment,
              ],

              customer_imposed_payment_fee:
                customerImposedPaymentFee,

              callbacks: {
                finish:
                  finishUrl,

                error:
                  finishUrl,
              },

              expiry: {
                unit:
                  "minutes",

                duration:
                  60,
              },
            }),

          cache:
            "no-store",
        }
      );

    const data =
      (await midtransResponse
        .json()) as MidtransResponse;

    /*
     * =========================================
     * MIDTRANS ERROR
     * =========================================
     */

    if (
      !midtransResponse.ok
    ) {
      console.error(
        "MIDTRANS ERROR:",
        data
      );

      return NextResponse.json(
        {
          success: false,

          message:
            data.error_messages?.[0] ??
            "Midtrans gagal membuat transaksi.",
        },
        {
          status:
            midtransResponse.status,
        }
      );
    }

    if (
      !data.token ||
      !data.redirect_url
    ) {
      console.error(
        "MIDTRANS INVALID RESPONSE:",
        data
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Midtrans tidak mengembalikan link pembayaran.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =========================================
     * PAYMENT DATABASE
     * =========================================
     */

    await prisma.payment.upsert({
      where: {
        orderId:
          order.id,
      },

      update: {
        transactionId:
          midtransOrderId,

        paymentType:
          paymentMethod,

        status:
          "PENDING",

        grossAmount:
          originalAmount,
      },

      create: {
        orderId:
          order.id,

        transactionId:
          midtransOrderId,

        paymentType:
          paymentMethod,

        status:
          "PENDING",

        grossAmount:
          originalAmount,
      },
    });

    /*
     * =========================================
     * RESPONSE
     * =========================================
     *
     * Provider cost tidak pernah dikirim
     * ke browser.
     */

    return NextResponse.json({
      success: true,

      token:
        data.token,

      redirectUrl:
        data.redirect_url,

      paymentMethod,

      subtotal:
        order.subtotal ??
        order.total,

      discountAmount:
        order.discountAmount,

      originalAmount,

      promoApplied:
        Boolean(
          order.promoCodeId
        ),

      paymentFeeWaived,

      automaticPaymentFee:
        !paymentFeeWaived,
    });
  } catch (error) {
    console.error(
      "CREATE MIDTRANS PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan saat membuat pembayaran.",
      },
      {
        status: 500,
      }
    );
  }
}