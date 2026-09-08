import crypto from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const dynamic =
  "force-dynamic";

const ADMIN_COOKIE_NAME =
  "admin_session";

const PROMO_TYPES = new Set([
  "FREE_PAYMENT_FEE",
  "FIXED_DISCOUNT",
  "PERCENT_DISCOUNT",
]);

/*
 * =================================
 * ADMIN AUTH
 * =================================
 */

function safeEqual(
  a: string,
  b: string
) {
  const aBuffer =
    Buffer.from(a);

  const bBuffer =
    Buffer.from(b);

  if (
    aBuffer.length !==
    bBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    aBuffer,
    bBuffer
  );
}

function getExpectedSessionToken() {
  const adminPassword =
    process.env.ADMIN_PASSWORD;

  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (
    !adminPassword ||
    !sessionSecret
  ) {
    return null;
  }

  return crypto
    .createHmac(
      "sha256",
      sessionSecret
    )
    .update(adminPassword)
    .digest("hex");
}

async function isAdminAuthenticated() {
  const cookieStore =
    await cookies();

  const sessionToken =
    cookieStore.get(
      ADMIN_COOKIE_NAME
    )?.value;

  const expectedToken =
    getExpectedSessionToken();

  if (
    !sessionToken ||
    !expectedToken
  ) {
    return false;
  }

  return safeEqual(
    sessionToken,
    expectedToken
  );
}

/*
 * =================================
 * HELPERS
 * =================================
 */

function normalizeOptionalInteger(
  value: unknown,
  options: {
    min?: number;
    max?: number;
  } = {}
):
  | number
  | null
  | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numberValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isInteger(
      numberValue
    )
  ) {
    return undefined;
  }

  if (
    options.min !==
      undefined &&
    numberValue <
      options.min
  ) {
    return undefined;
  }

  if (
    options.max !==
      undefined &&
    numberValue >
      options.max
  ) {
    return undefined;
  }

  return numberValue;
}

function normalizeOptionalDate(
  value: unknown
):
  | Date
  | null
  | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    return undefined;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return undefined;
  }

  return date;
}

function invalidInteger(
  value:
    | number
    | null
    | undefined
) {
  return value === undefined;
}

/*
 * =================================
 * PATCH PROMO
 * =================================
 *
 * Digunakan untuk:
 *
 * - edit promo
 * - aktif / nonaktif promo
 * - ubah kuota
 * - ubah periode
 * - ubah syarat customer
 * - ubah target produk
 */

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
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

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID promo tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const existingPromo =
      await prisma.promoCode.findUnique({
        where: {
          id,
        },
      });

    if (!existingPromo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promo tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    const code = String(body.code ?? existingPromo.code).trim();

    const name =
      body.name === undefined
        ? existingPromo.name
        : typeof body.name ===
            "string"
          ? body.name.trim() ||
            null
          : null;

    const description =
      body.description ===
      undefined
        ? existingPromo.description
        : typeof body.description ===
            "string"
          ? body.description.trim() ||
            null
          : null;

    const type =
      typeof body.type ===
      "string"
        ? body.type
            .trim()
            .toUpperCase()
        : existingPromo.type;

    const active =
      typeof body.active ===
      "boolean"
        ? body.active
        : existingPromo.active;

    const discountValue =
      body.discountValue ===
      undefined
        ? existingPromo.discountValue
        : normalizeOptionalInteger(
            body.discountValue,
            {
              min: 1,
            }
          );

    const maxDiscount =
      body.maxDiscount ===
      undefined
        ? existingPromo.maxDiscount
        : normalizeOptionalInteger(
            body.maxDiscount,
            {
              min: 1,
            }
          );

    const minOrder =
      body.minOrder ===
      undefined
        ? existingPromo.minOrder
        : normalizeOptionalInteger(
            body.minOrder,
            {
              min: 0,
            }
          );

    const minimumMargin =
      body.minimumMargin ===
      undefined
        ? existingPromo.minimumMargin
        : normalizeOptionalInteger(
            body.minimumMargin,
            {
              min: 0,
            }
          );

    const maxUses =
      body.maxUses ===
      undefined
        ? existingPromo.maxUses
        : normalizeOptionalInteger(
            body.maxUses,
            {
              min: 1,
            }
          );

    const maxUsesPerCustomer =
      body.maxUsesPerCustomer ===
      undefined
        ? existingPromo.maxUsesPerCustomer
        : normalizeOptionalInteger(
            body.maxUsesPerCustomer,
            {
              min: 1,
            }
          );

    const minCompletedOrders =
      body.minCompletedOrders ===
      undefined
        ? existingPromo.minCompletedOrders
        : normalizeOptionalInteger(
            body.minCompletedOrders,
            {
              min: 0,
            }
          );

    const startsAt =
      body.startsAt ===
      undefined
        ? existingPromo.startsAt
        : normalizeOptionalDate(
            body.startsAt
          );

    const expiresAt =
      body.expiresAt ===
      undefined
        ? existingPromo.expiresAt
        : normalizeOptionalDate(
            body.expiresAt
          );

    const firstOrderOnly =
      typeof body.firstOrderOnly ===
      "boolean"
        ? body.firstOrderOnly
        : existingPromo.firstOrderOnly;

    const productId =
      body.productId ===
      undefined
        ? existingPromo.productId
        : typeof body.productId ===
              "string" &&
            body.productId.trim()
          ? body.productId.trim()
          : null;

    /*
     * ===============================
     * VALIDASI DASAR
     * ===============================
     */

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kode promo wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !PROMO_TYPES.has(type)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Jenis promo tidak didukung.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      invalidInteger(
        discountValue
      ) ||
      invalidInteger(
        maxDiscount
      ) ||
      invalidInteger(
        minOrder
      ) ||
      invalidInteger(
        minimumMargin
      ) ||
      invalidInteger(
        maxUses
      ) ||
      invalidInteger(
        maxUsesPerCustomer
      ) ||
      invalidInteger(
        minCompletedOrders
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nilai angka promo tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      startsAt === undefined ||
      expiresAt === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tanggal promo tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      startsAt &&
      expiresAt &&
      startsAt >= expiresAt
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tanggal berakhir harus setelah tanggal mulai.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Promo order pertama berarti
     * customer harus memiliki
     * 0 order PAID sebelumnya.
     *
     * Karena itu tidak boleh
     * digabung dengan syarat
     * minimal order selesai > 0.
     */

    if (
      firstOrderOnly &&
      minCompletedOrders !==
        null &&
      minCompletedOrders > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promo order pertama tidak dapat digabung dengan minimal transaksi selesai.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ===============================
     * VALIDASI BENEFIT
     * ===============================
     */

    if (
      type ===
        "FIXED_DISCOUNT" &&
      (
        discountValue ===
          null ||
        discountValue <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Diskon nominal wajib memiliki nilai diskon.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      type ===
      "PERCENT_DISCOUNT"
    ) {
      if (
        discountValue ===
          null ||
        discountValue < 1 ||
        discountValue > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Diskon persen harus antara 1 sampai 100.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * ===============================
     * VALIDASI KUOTA
     * ===============================
     *
     * Jangan izinkan maxUses
     * lebih kecil daripada jumlah
     * promo yang sudah terpakai.
     */

    if (
      maxUses !== null &&
      maxUses <
        existingPromo.usedCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Kuota total tidak boleh lebih kecil dari ${existingPromo.usedCount} penggunaan yang sudah tercatat.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ===============================
     * VALIDASI PRODUK
     * ===============================
     */

    if (productId) {
      const product =
        await prisma.product.findUnique({
          where: {
            id: productId,
          },

          select: {
            id: true,
            game: true,
            active: true,
          },
        });

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Produk tidak ditemukan.",
          },
          {
            status: 404,
          }
        );
      }

      if (!product.active) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Produk yang dipilih sedang tidak aktif.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        product.game
          .trim()
          .toLowerCase() !==
        "free fire"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promo admin ini hanya mendukung produk Free Fire.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * ===============================
     * VALIDASI DUPLIKAT KODE
     * ===============================
     */

    if (
      code !==
      existingPromo.code
    ) {
      const duplicate =
        await prisma.promoCode.findUnique({
          where: {
            code,
          },

          select: {
            id: true,
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Kode promo sudah digunakan.",
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
     * ===============================
     * NORMALISASI BERDASARKAN TYPE
     * ===============================
     */

    const finalDiscountValue =
      type ===
      "FREE_PAYMENT_FEE"
        ? null
        : discountValue;

    const finalMaxDiscount =
      type ===
      "PERCENT_DISCOUNT"
        ? maxDiscount
        : null;

    /*
     * ===============================
     * UPDATE DATABASE
     * ===============================
     */

    const promo =
      await prisma.promoCode.update({
        where: {
          id,
        },

        data: {
          code,
          name,
          description,

          type,
          active,

          discountValue:
            finalDiscountValue,

          maxDiscount:
            finalMaxDiscount,

          minOrder,

          minimumMargin:
            minimumMargin ??
            0,

          startsAt,
          expiresAt,

          maxUses,

          maxUsesPerCustomer,

          firstOrderOnly,

          minCompletedOrders,

          productId,
        },

        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              active: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      message:
        "Promo berhasil diperbarui.",

      promo,
    });
  } catch (error) {
    console.error(
      "ADMIN PROMO PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal memperbarui promo.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =================================
 * DELETE PROMO
 * =================================
 *
 * Promo yang BELUM pernah dipakai
 * boleh dihapus permanen.
 *
 * Promo yang SUDAH pernah dipakai
 * tidak dihapus karena masih
 * terhubung dengan histori order.
 *
 * Untuk promo tersebut, gunakan
 * nonaktifkan melalui PATCH.
 */

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
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

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID promo tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const promo =
      await prisma.promoCode.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          code: true,
          usedCount: true,

          _count: {
            select: {
              orders: true,
            },
          },
        },
      });

    if (!promo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promo tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Jaga histori order.
     *
     * Bahkan jika usedCount = 0,
     * promo mungkin sudah terpasang
     * pada order yang belum PAID.
     */

    if (
      promo.usedCount > 0 ||
      promo._count.orders > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Promo sudah memiliki histori order. Nonaktifkan promo daripada menghapusnya.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.promoCode.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Promo berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "ADMIN PROMO DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal menghapus promo.",
      },
      {
        status: 500,
      }
    );
  }
}