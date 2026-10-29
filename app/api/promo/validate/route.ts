import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveSellingPrice } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_PAYMENT_FEE =
  "FREE_PAYMENT_FEE";

const FIXED_DISCOUNT =
  "FIXED_DISCOUNT";

const PERCENT_DISCOUNT =
  "PERCENT_DISCOUNT";

function invalidPromo(
  message: string
) {
  return NextResponse.json({
    success: true,
    valid: false,
    message,
  });
}

function calculateDiscount({
  promoType,
  discountValue,
  maxDiscount,
  productPrice,
}: {
  promoType: string;
  discountValue: number | null;
  maxDiscount: number | null;
  productPrice: number;
}) {
  /*
   * =========================================
   * FIXED DISCOUNT
   * =========================================
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
   * =========================================
   * PERCENT DISCOUNT
   * =========================================
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
        (productPrice *
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

function normalizeWhatsapp(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .replace(/\D/g, "")
    .trim();
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const code = String(
      body.code ?? ""
    )
      .trim()
      .toLowerCase();

    const productId = String(
      body.productId ?? ""
    ).trim();

    // Promo spesial Free Fire: pembatasan lintas akun berdasarkan UID.
    const freeFireUid = String(body.uid ?? "").trim();
    const limitedFreeFirePromoCodes = ["FF50HEMAT", "FF100HEMAT", "FF140HEMAT"];
    const isLimitedFreeFirePromo = limitedFreeFirePromoCodes.includes(code.toUpperCase());
    if (isLimitedFreeFirePromo && !/^\\d{6,20}$/.test(freeFireUid)) {
      return invalidPromo("Masukkan UID Free Fire yang valid sebelum menggunakan promo ini.");
    }
    if (isLimitedFreeFirePromo) {
      const existingUidClaim = await prisma.order.findFirst({
        where: {
          uid: freeFireUid,
          promoCode: { code: { in: limitedFreeFirePromoCodes, mode: "insensitive" } },
          OR: [
            { paymentStatus: { in: ["PAID", "SUCCESS"] }, promoRedeemedAt: { not: null } },
            { paymentStatus: "PENDING", promoAppliedAt: { not: null } },
          ],
        },
        select: { id: true },
      });
      if (existingUidClaim) {
        return invalidPromo("UID Free Fire ini sudah memakai atau sedang memiliki klaim promo. Satu UID hanya boleh memakai satu dari tiga kode promo spesial.");
      }
    }

    // Semua promo checkout wajib digunakan oleh customer yang login.
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          requiresLogin: true,
          message: "Login ke akun 7 April Store terlebih dahulu untuk menggunakan kode promo.",
        },
        { status: 401 },
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.id },
      select: { id: true, whatsapp: true },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          requiresLogin: true,
          message: "Akun pelanggan tidak ditemukan. Silakan login kembali.",
        },
        { status: 401 },
      );
    }

    // Login menjadi identitas utama promo. Nomor WhatsApp akun dipakai
    // untuk batas pemakaian promo, sedangkan nomor checkout boleh diedit
    // jika pelanggan sudah tidak menggunakan nomor lama.
    const whatsapp = normalizeWhatsapp(customer.whatsapp);

    /*
     * =========================================
     * VALIDASI INPUT
     * =========================================
     */

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message:
            "Masukkan kode promo.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * AMBIL PROMO
     * =========================================
     */

    const promo =
      await prisma.promoCode.findFirst({
        where: {
          code: {
            equals: code,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          active: true,

          discountValue: true,
          maxDiscount: true,
          minOrder: true,
          minimumMargin: true,

          startsAt: true,
          expiresAt: true,

          maxUses: true,
          usedCount: true,
          maxUsesPerCustomer: true,

          firstOrderOnly: true,
          minCompletedOrders: true,

          productId: true,
          affiliateId: true,
        },
      });

    if (!promo) {
      return invalidPromo(
        "Kode promo tidak valid."
      );
    }

    /*
     * Promo khusus ulasan menggunakan kode yang diawali REVIEW.
     * Syarat dihitung hanya dari ulasan pada pesanan milik akun
     * yang sedang login dan transaksinya sudah berhasil.
     */
    if (promo.code.trim().toUpperCase().startsWith("REVIEW")) {
      const qualifyingReview = await prisma.review.findFirst({
        where: {
          order: {
            customerId: customer.id,
            paymentStatus: { in: ["PAID", "SUCCESS"] },
            providerStatus: { in: ["SUCCESS", "SUKSES"] },
          },
        },
        select: { id: true },
      });

      if (!qualifyingReview) {
        return invalidPromo(
          "Promo ini khusus pelanggan yang sudah mengirim ulasan untuk pesanan berhasil saat login ke akun 7 April Store."
        );
      }
    }

    /*
     * =========================================
     * STATUS PROMO
     * =========================================
     */

    if (!promo.active) {
      return invalidPromo(
        "Kode promo sudah tidak aktif."
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
      return invalidPromo(
        "Promo belum mulai."
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
      return invalidPromo(
        "Kode promo sudah kedaluwarsa."
      );
    }

    /*
     * =========================================
     * BATAS GLOBAL
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
          "PROMO INVALID MAX USES:",
          {
            promoId:
              promo.id,
          }
        );

        return invalidPromo(
          "Konfigurasi promo tidak valid."
        );
      }

      if (
        promo.usedCount >=
        promo.maxUses
      ) {
        return invalidPromo(
          "Batas penggunaan kode promo sudah habis."
        );
      }
    }

    /*
     * =========================================
     * APAKAH PROMO BUTUH IDENTITAS CUSTOMER
     * =========================================
     *
     * WhatsApp digunakan sebagai identitas
     * customer untuk sementara.
     *
     * Dibutuhkan jika promo mempunyai:
     *
     * - maxUsesPerCustomer
     * - firstOrderOnly
     * - minCompletedOrders
     */

    const requiresCustomer =
      promo.maxUsesPerCustomer !==
        null ||
      promo.firstOrderOnly ||
      promo.minCompletedOrders !==
        null;

    if (
      requiresCustomer &&
      !whatsapp
    ) {
      return invalidPromo(
        "Masukkan nomor WhatsApp terlebih dahulu untuk menggunakan promo ini."
      );
    }

    if (
      requiresCustomer &&
      !/^\d{10,15}$/.test(
        whatsapp
      )
    ) {
      return invalidPromo(
        "Nomor WhatsApp tidak valid."
      );
    }

    /*
     * =========================================
     * RIWAYAT CUSTOMER
     * =========================================
     */

    let completedOrders = 0;

    if (requiresCustomer) {
      /*
       * Semua transaksi PAID sebelumnya
       * milik nomor WhatsApp ini.
       */

      completedOrders =
        await prisma.order.count({
          where: {
            whatsapp,
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
      return invalidPromo(
        "Promo ini hanya berlaku untuk pembelian pertama."
      );
    }

    /*
     * =========================================
     * CUSTOMER SERING TOP UP
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
        promo.minCompletedOrders < 0
      ) {
        console.error(
          "PROMO INVALID MIN COMPLETED ORDERS:",
          {
            promoId:
              promo.id,
          }
        );

        return invalidPromo(
          "Konfigurasi promo tidak valid."
        );
      }

      if (
        completedOrders <
        promo.minCompletedOrders
      ) {
        return invalidPromo(
          `Promo ini khusus pelanggan yang sudah melakukan minimal ${promo.minCompletedOrders} transaksi berhasil.`
        );
      }
    }

    /*
     * =========================================
     * BATAS PER CUSTOMER
     * =========================================
     */

    let customerPromoUses:
      | number
      | null = null;

    if (
      promo.maxUsesPerCustomer !==
      null
    ) {
      if (
        !Number.isInteger(
          promo.maxUsesPerCustomer
        ) ||
        promo.maxUsesPerCustomer <= 0
      ) {
        console.error(
          "PROMO INVALID MAX USES PER CUSTOMER:",
          {
            promoId:
              promo.id,
          }
        );

        return invalidPromo(
          "Konfigurasi promo tidak valid."
        );
      }

      customerPromoUses =
        await prisma.order.count({
          where: {
            whatsapp,

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
        return invalidPromo(
          "Batas penggunaan promo untuk akun ini sudah habis."
        );
      }
    }

    /*
     * =========================================
     * PRODUK
     * =========================================
     *
     * Produk wajib tersedia kalau:
     *
     * - promo FIXED_DISCOUNT
     * - promo PERCENT_DISCOUNT
     * - promo mempunyai target productId
     * - promo mempunyai minOrder
     *
     * Untuk FREE_PAYMENT_FEE umum,
     * productId tetap boleh dikirim.
     */

    const requiresProduct =
      promo.type ===
        FIXED_DISCOUNT ||
      promo.type ===
        PERCENT_DISCOUNT ||
      promo.productId !==
        null ||
      promo.minOrder !==
        null;

    if (
      requiresProduct &&
      !productId
    ) {
      return invalidPromo(
        "Pilih produk terlebih dahulu untuk menggunakan promo ini."
      );
    }

    let product:
      | {
          id: string;
          game: string;
          name: string;
          sku: string;
          price: number;
          providerPrice: number;
          active: boolean;
        }
      | null = null;

    if (productId) {
      product =
        await prisma.product.findUnique({
          where: {
            id: productId,
          },

          select: {
            id: true,
            game: true,
            name: true,
            sku: true,
            price: true,
            providerPrice: true,
            active: true,
          },
        });

      if (!product) {
        return invalidPromo(
          "Produk tidak ditemukan."
        );
      }

      if (!product.active) {
        return invalidPromo(
          "Produk sedang tidak aktif."
        );
      }

      // Samakan harga promo dengan harga efektif yang ditampilkan di katalog.
      product.price = getEffectiveSellingPrice({
        name: product.name,
        sku: product.sku,
        providerPrice: product.providerPrice,
        fallbackPrice: product.price,
      });

      /*
       * =========================================
       * VALIDASI GAME
       * =========================================
       */

      const normalizedGame =
        product.game
          .trim()
          .toLowerCase()
          .replace(
            /[_-]+/g,
            " "
          )
          .replace(
            /\s+/g,
            " "
          );

      if (
        normalizedGame !==
        "free fire"
      ) {
        return invalidPromo(
          "Promo ini tidak berlaku untuk produk tersebut."
        );
      }

      /*
       * =========================================
       * VALIDASI HARGA
       * =========================================
       */

      if (
        !Number.isInteger(
          product.price
        ) ||
        product.price <= 0
      ) {
        console.error(
          "PROMO INVALID PRODUCT PRICE:",
          {
            productId:
              product.id,
          }
        );

        return invalidPromo(
          "Harga produk tidak valid."
        );
      }

      if (
        !Number.isInteger(
          product.providerPrice
        ) ||
        product.providerPrice <= 0
      ) {
        console.error(
          "PROMO INVALID PROVIDER PRICE:",
          {
            productId:
              product.id,
          }
        );

        return invalidPromo(
          "Harga provider tidak valid."
        );
      }
    }

    /*
     * =========================================
     * TARGET PRODUK TERTENTU
     * =========================================
     */

    if (promo.productId !== null) {
      const promoTargetProduct = await prisma.product.findUnique({
        where: { id: promo.productId },
        select: { id: true, name: true, price: true, game: true },
      });

      const normalizeProductName = (value: string) =>
        value.trim().toLowerCase().replace(/\s+/g, " ");

      // Exact ID first; fall back only to an identical game/name/price.
      const sameTargetProduct = Boolean(
        product &&
        promoTargetProduct &&
        (
          product.id === promoTargetProduct.id ||
          (
            normalizeProductName(product.game) === normalizeProductName(promoTargetProduct.game) &&
            normalizeProductName(product.name) === normalizeProductName(promoTargetProduct.name) &&
            product.price === promoTargetProduct.price
          )
        )
      );

      if (!sameTargetProduct) {
        return invalidPromo(
          "Promo ini tidak berlaku untuk nominal yang dipilih."
        );
      }
    }

    /*
     * =========================================
     * MINIMUM ORDER
     * =========================================
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
          "PROMO INVALID MIN ORDER:",
          {
            promoId:
              promo.id,
          }
        );

        return invalidPromo(
          "Konfigurasi promo tidak valid."
        );
      }

      if (
        !product
      ) {
        return invalidPromo(
          "Pilih produk terlebih dahulu."
        );
      }

      if (
        product.price <
        promo.minOrder
      ) {
        return invalidPromo(
          `Promo berlaku untuk pembelian minimal Rp${promo.minOrder.toLocaleString(
            "id-ID"
          )}.`
        );
      }
    }

    /*
     * =========================================
     * FREE PAYMENT FEE
     * =========================================
     *
     * Semua aturan umum di atas tetap berlaku:
     *
     * - tanggal mulai
     * - expired
     * - kuota global
     * - batas per customer
     * - first order
     * - loyal customer
     * - target produk
     * - minimum order
     */

    if (
      promo.type ===
      FREE_PAYMENT_FEE
    ) {
      const remainingUses =
        promo.maxUses === null
          ? null
          : Math.max(
              0,
              promo.maxUses -
                promo.usedCount
            );

      const remainingCustomerUses =
        promo.maxUsesPerCustomer ===
          null
          ? null
          : Math.max(
              0,
              promo.maxUsesPerCustomer -
                (customerPromoUses ??
                  0)
            );

      return NextResponse.json({
        success: true,
        valid: true,

        benefit:
          FREE_PAYMENT_FEE,

        paymentFeeWaived:
          true,

        discountAmount:
          0,

        originalPrice:
          product?.price ??
          null,

        finalProductPrice:
          product?.price ??
          null,

        remainingUses,

        remainingCustomerUses,

        message:
          "Kode promo berhasil digunakan.",
      });
    }

    /*
     * =========================================
     * JENIS PROMO
     * =========================================
     */

    if (
      promo.type !==
        FIXED_DISCOUNT &&
      promo.type !==
        PERCENT_DISCOUNT
    ) {
      return invalidPromo(
        "Jenis kode promo tidak didukung."
      );
    }

    if (!product) {
      return invalidPromo(
        "Pilih produk terlebih dahulu untuk menggunakan promo ini."
      );
    }

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

        productPrice:
          product.price,
      });

    if (
      discountAmount === null ||
      !Number.isInteger(
        discountAmount
      ) ||
      discountAmount <= 0
    ) {
      console.error(
        "PROMO INVALID DISCOUNT CONFIG:",
        {
          promoId:
            promo.id,

          promoType:
            promo.type,
        }
      );

      return invalidPromo(
        "Konfigurasi diskon promo tidak valid."
      );
    }

    if (
      discountAmount >=
      product.price
    ) {
      return invalidPromo(
        "Diskon promo terlalu besar untuk produk ini."
      );
    }

    /*
     * =========================================
     * HARGA SETELAH DISKON
     * =========================================
     */

    const finalProductPrice =
      product.price -
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
      promo.minimumMargin < -1_000_000 ||
      promo.minimumMargin > 1_000_000
    ) {
      console.error(
        "PROMO INVALID MINIMUM MARGIN:",
        {
          promoId:
            promo.id,
        }
      );

      return invalidPromo(
        "Konfigurasi margin promo tidak valid."
      );
    }

    const minimumAllowedPrice =
      product.providerPrice +
      promo.minimumMargin;

    /*
     * =========================================
     * PENGAMAN PROFIT
     * =========================================
     */

    if (
      finalProductPrice <
      minimumAllowedPrice
    ) {
      return invalidPromo(
        "Promo ini tidak dapat digunakan untuk nominal yang dipilih."
      );
    }

    /*
     * =========================================
     * SISA PEMAKAIAN
     * =========================================
     */

    const remainingUses =
      promo.maxUses === null
        ? null
        : Math.max(
            0,
            promo.maxUses -
              promo.usedCount
          );

    const remainingCustomerUses =
      promo.maxUsesPerCustomer ===
        null
        ? null
        : Math.max(
            0,
            promo.maxUsesPerCustomer -
              (customerPromoUses ??
                0)
          );

    /*
     * =========================================
     * RESPONSE
     * =========================================
     */

    return NextResponse.json({
      success: true,
      valid: true,

      benefit:
        promo.type,

      paymentFeeWaived:
        false,

      originalPrice:
        product.price,

      discountAmount,

      finalProductPrice,

      remainingUses,

      remainingCustomerUses,

      message:
        `Promo berhasil. Potongan Rp${discountAmount.toLocaleString(
          "id-ID"
        )}.`,
    });
  } catch (error) {
    console.error(
      "PROMO VALIDATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        valid: false,
        message:
          "Gagal memeriksa kode promo.",
      },
      {
        status: 500,
      }
    );
  }
}