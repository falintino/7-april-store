import crypto from "crypto";

import Link from "next/link";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import PromoManager from "./PromoManager";

export const dynamic =
  "force-dynamic";

const ADMIN_COOKIE_NAME =
  "admin_session";

/*
 * =================================
 * SAFE STRING COMPARISON
 * =================================
 *
 * Digunakan agar perbandingan
 * session token admin dilakukan
 * dengan timing-safe comparison.
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

/*
 * =================================
 * EXPECTED ADMIN SESSION TOKEN
 * =================================
 *
 * Token dibuat dari:
 *
 * ADMIN_PASSWORD
 * +
 * ADMIN_SESSION_SECRET
 *
 * Menggunakan HMAC SHA256.
 */

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

/*
 * =================================
 * VALIDASI SESSION ADMIN
 * =================================
 */

function isValidAdminSession(
  sessionToken:
    | string
    | undefined
) {
  if (!sessionToken) {
    return false;
  }

  const expectedToken =
    getExpectedSessionToken();

  if (!expectedToken) {
    return false;
  }

  return safeEqual(
    sessionToken,
    expectedToken
  );
}

/*
 * =================================
 * ADMIN PROMOS PAGE
 * =================================
 */

export default async function AdminPromosPage() {
  /*
   * ===============================
   * AUTH ADMIN
   * ===============================
   */

  const cookieStore =
    await cookies();

  const sessionToken =
    cookieStore.get(
      ADMIN_COOKIE_NAME
    )?.value;

  if (
    !isValidAdminSession(
      sessionToken
    )
  ) {
    redirect(
      "/admin/login"
    );
  }

  /*
   * ===============================
   * AMBIL PRODUK FREE FIRE
   * ===============================
   *
   * Hanya produk aktif yang perlu
   * muncul pada pilihan promo.
   *
   * providerPrice tidak dikirim ke
   * komponen client.
   */

  const products =
    await prisma.product.findMany({
      where: {
        active: true,

        game: {
          equals:
            "Free Fire",
          mode:
            "insensitive",
        },
      },

      orderBy: {
        price: "asc",
      },

      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        active: true,
      },
    });

  /*
   * ===============================
   * AMBIL PROMO
   * ===============================
   */

  const promoRows =
    await prisma.promoCode.findMany({
      orderBy: {
        createdAt:
          "desc",
      },

      select: {
        id: true,
        code: true,
        name: true,
        description: true,

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

        maxUsesPerCustomer:
          true,

        firstOrderOnly: true,

        minCompletedOrders:
          true,

        productId: true,

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

  /*
   * ===============================
   * SERIALIZE DATE
   * ===============================
   *
   * PromoManager adalah Client
   * Component.
   *
   * Kita ubah Date menjadi ISO
   * string sebelum dikirim.
   */

  const promos =
    promoRows.map(
      (promo) => ({
        ...promo,

        startsAt:
          promo.startsAt
            ? promo.startsAt.toISOString()
            : null,

        expiresAt:
          promo.expiresAt
            ? promo.expiresAt.toISOString()
            : null,
      })
    );

  return (
    <main className="min-h-screen bg-[#060b16] px-4 py-8 text-white sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              Admin Promo
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Kelola Promo
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Buat promo diskon,
              bebas biaya pembayaran,
              promo terbatas,
              promo pelanggan pertama,
              dan promo pelanggan loyal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              ← Dashboard
            </Link>

            <Link
              href="/topup/free-fire"
              target="_blank"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Lihat Top Up
            </Link>
          </div>
        </div>

        {/* INFO */}

        <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
              🎟
            </div>

            <div>
              <p className="text-sm font-bold text-blue-300">
                Sistem Promo
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Backend tetap
                memvalidasi promo saat
                checkout. Harga dan
                syarat promo tidak hanya
                bergantung pada tampilan
                browser.
              </p>
            </div>
          </div>
        </div>

        {/* PROMO MANAGER */}

        <PromoManager
          initialPromos={
            promos
          }
          products={products}
        />
      </div>
    </main>
  );
}