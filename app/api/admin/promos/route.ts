import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_COOKIE_NAME =
  "admin_session";

const PROMO_TYPES = new Set([
  "FREE_PAYMENT_FEE",
  "FIXED_DISCOUNT",
  "PERCENT_DISCOUNT",
]);

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

function getExpectedAdminToken() {
  const adminPassword =
    process.env.ADMIN_PASSWORD;

  const adminSessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (
    !adminPassword ||
    !adminSessionSecret
  ) {
    return null;
  }

  return crypto
    .createHmac(
      "sha256",
      adminSessionSecret
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

  if (!sessionToken) {
    return false;
  }

  const expectedToken =
    getExpectedAdminToken();

  if (!expectedToken) {
    return false;
  }

  return safeEqual(
    sessionToken,
    expectedToken
  );
}

function normalizeOptionalInteger(
  value: unknown,
  options?: {
    min?: number;
    max?: number;
  }
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numberValue =
    Number(value);

  if (
    !Number.isInteger(
      numberValue
    )
  ) {
    return undefined;
  }

  if (
    options?.min !== undefined &&
    numberValue < options.min
  ) {
    return undefined;
  }

  if (
    options?.max !== undefined &&
    numberValue > options.max
  ) {
    return undefined;
  }

  return numberValue;
}

function normalizeOptionalDate(
  value: unknown
) {
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

export async function GET() {
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

  try {
    const promos =
      await prisma.promoCode.findMany({
        orderBy: {
          createdAt:
            "desc",
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

          affiliate: {
            select: {
              id: true,
              name: true,
              code: true,
              active: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      promos,
    });
  } catch (error) {
    console.error(
      "ADMIN PROMOS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal mengambil daftar promo.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
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

  try {
    const body =
      await request.json();

    const code = String(body.code ?? "").trim();

    const name =
      typeof body.name ===
        "string" &&
      body.name.trim()
        ? body.name.trim()
        : null;

    const description =
      typeof body.description ===
        "string" &&
      body.description.trim()
        ? body.description.trim()
        : null;

    const type =
      typeof body.type ===
      "string"
        ? body.type.trim()
        : "";

    const active =
      body.active !==
      false;

    const discountValue =
      normalizeOptionalInteger(
        body.discountValue,
        {
          min: 1,
        }
      );

    const maxDiscount =
      normalizeOptionalInteger(
        body.maxDiscount,
        {
          min: 1,
        }
      );

    const minOrder =
      normalizeOptionalInteger(
        body.minOrder,
        {
          min: 0,
        }
      );

    const minimumMargin =
      normalizeOptionalInteger(
        body.minimumMargin,
        {
          min: 0,
        }
      );

    const maxUses =
      normalizeOptionalInteger(
        body.maxUses,
        {
          min: 1,
        }
      );

    const maxUsesPerCustomer =
      normalizeOptionalInteger(
        body.maxUsesPerCustomer,
        {
          min: 1,
        }
      );

    const minCompletedOrders =
      normalizeOptionalInteger(
        body.minCompletedOrders,
        {
          min: 0,
        }
      );

    const startsAt =
      normalizeOptionalDate(
        body.startsAt
      );

    const expiresAt =
      normalizeOptionalDate(
        body.expiresAt
      );

    const firstOrderOnly =
      body.firstOrderOnly ===
      true;

    const productId =
      typeof body.productId ===
        "string" &&
      body.productId.trim()
        ? body.productId.trim()
        : null;

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
            "Jenis promo tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      discountValue ===
        undefined ||
      maxDiscount ===
        undefined ||
      minOrder ===
        undefined ||
      minimumMargin ===
        undefined ||
      maxUses ===
        undefined ||
      maxUsesPerCustomer ===
        undefined ||
      minCompletedOrders ===
        undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ada nilai angka yang tidak valid.",
        },
        {
          status: 400,
        }
      );
      }

  if (
    firstOrderOnly &&
    minCompletedOrders !== null &&
    minCompletedOrders > 0
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Promo order pertama tidak dapat digabung dengan minimal transaksi selesai.",
      },
      { status: 400 }
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
            "Format tanggal tidak valid.",
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
            "Tanggal mulai harus sebelum tanggal berakhir.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      type ===
        "FIXED_DISCOUNT" &&
      discountValue === null
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
        null
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Diskon persen wajib memiliki nilai diskon.",
          },
          {
            status: 400,
          }
        );
      }

      if (
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

    if (
      type ===
      "FREE_PAYMENT_FEE"
    ) {
      if (
        discountValue !==
        null
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Promo bebas biaya pembayaran tidak menggunakan nilai diskon produk.",
          },
          {
            status: 400,
          }
        );
      }
    }

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
            status: 400,
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
              "Promo saat ini hanya mendukung produk Free Fire.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const existingPromo =
      await prisma.promoCode.findUnique({
        where: {
          code,
        },

        select: {
          id: true,
        },
      });

    if (existingPromo) {
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

    const promo =
      await prisma.promoCode.create({
        data: {
          code,
          name,
          description,
          type,
          active,

          discountValue:
            type ===
            "FREE_PAYMENT_FEE"
              ? null
              : discountValue,

          maxDiscount:
            type ===
            "PERCENT_DISCOUNT"
              ? maxDiscount
              : null,

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

    return NextResponse.json(
      {
        success: true,
        message:
          "Promo berhasil dibuat.",
        promo,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN PROMOS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal membuat promo.",
      },
      {
        status: 500,
      }
    );
  }
}