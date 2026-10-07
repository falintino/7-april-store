import crypto from "crypto";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import type { ReactNode } from "react";

import { prisma } from "@/lib/prisma";

import AdminLogoutButton from "./AdminLogoutButton";

export const dynamic = "force-dynamic";

const ADMIN_COOKIE_NAME = "admin_session";

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    aBuffer,
    bBuffer,
  );
}

function getExpectedSessionToken() {
  const adminPassword =
    process.env.ADMIN_PASSWORD;

  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return null;
  }

  return crypto
    .createHmac("sha256", sessionSecret)
    .update(adminPassword)
    .digest("hex");
}

function isValidAdminSession(
  sessionToken: string | undefined,
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
    expectedToken,
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "-";
  }

  const formatted = new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "long",
      timeStyle: "medium",
      timeZone: "Asia/Jakarta",
    },
  ).format(date);

  return `${formatted} WIB`;
}

function formatDateShort(date: Date | null) {
  if (!date) {
    return "-";
  }

  const formatted = new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    },
  ).format(date);

  return `${formatted} WIB`;
}

function maskUid(uid: string) {
  if (uid.length <= 4) {
    return "****";
  }

  return `${uid.slice(
    0,
    3,
  )}****${uid.slice(-2)}`;
}

function maskWhatsapp(whatsapp: string) {
  if (whatsapp.length <= 6) {
    return "********";
  }

  return `${whatsapp.slice(
    0,
    4,
  )}****${whatsapp.slice(-3)}`;
}

function getStatusClass(status: string) {
  if (
    status === "PAID" ||
    status === "SUCCESS" ||
    status === "REFUNDED"
  ) {
    return "border-green-500/30 bg-green-500/10 text-green-400";
  }

  if (
    status === "FAILED" ||
    status === "CANCELLED" ||
    status === "EXPIRED"
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-400";
  }

  if (
    status === "PROCESSING"
  ) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }

  if (
    status ===
      "REFUND_REQUIRED" ||
    status ===
      "REFUND_PROCESSING"
  ) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-400";
  }

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
}

function getParam(
  params: Record<
    string,
    string | string[] | undefined
  >,
  key: string,
) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parseJakartaDateStart(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00+07:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseJakartaDateEnd(
  value: string,
) {
  const start =
    parseJakartaDateStart(value);

  if (!start) {
    return null;
  }

  return new Date(
    start.getTime() +
      24 * 60 * 60 * 1000,
  );
}

function getHistoryEvents(order: {
  createdAt: Date;
  updatedAt: Date;
  providerUpdatedAt: Date | null;
  payment: {
    paidAt: Date | null;
  } | null;
}) {
  const events: {
    label: string;
    date: Date;
    className: string;
  }[] = [
    {
      label: "Pesanan dibuat",
      date: order.createdAt,
      className:
        "bg-slate-500",
    },
  ];

  if (order.payment?.paidAt) {
    events.push({
      label: "Pembayaran PAID",
      date: order.payment.paidAt,
      className:
        "bg-green-500",
    });
  }

  if (order.providerUpdatedAt) {
    events.push({
      label: "Provider diperbarui",
      date: order.providerUpdatedAt,
      className:
        "bg-blue-500",
    });
  }

  if (
    order.updatedAt.getTime() !==
    order.createdAt.getTime()
  ) {
    events.push({
      label: "Terakhir diubah",
      date: order.updatedAt,
      className:
        "bg-violet-500",
    });
  }

  return events.sort(
    (a, b) =>
      b.date.getTime() -
      a.date.getTime(),
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const cookieStore =
    await cookies();

  const sessionToken =
    cookieStore.get(
      ADMIN_COOKIE_NAME,
    )?.value;

  if (
    !isValidAdminSession(
      sessionToken,
    )
  ) {
    redirect("/admin/login");
  }

  const params =
    searchParams
      ? await searchParams
      : {};

  const q = getParam(
    params,
    "q",
  ).trim();

  const paymentStatus =
    getParam(
      params,
      "paymentStatus",
    ).trim();

  const providerStatus =
    getParam(
      params,
      "providerStatus",
    ).trim();

  const from =
    getParam(
      params,
      "from",
    ).trim();

  const to =
    getParam(
      params,
      "to",
    ).trim();

  const sort =
    getParam(
      params,
      "sort",
    ) === "oldest"
      ? "oldest"
      : "newest";

  const requestedLimit =
    Number(
      getParam(
        params,
        "limit",
      ),
    );

  const limit =
    requestedLimit === 25 ||
    requestedLimit === 50 ||
    requestedLimit === 100
      ? requestedLimit
      : 50;

  const requestedPage =
    Number(
      getParam(
        params,
        "page",
      ),
    );

  const page =
    Number.isInteger(
      requestedPage,
    ) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const andFilters: Prisma.OrderWhereInput[] =
    [];

  if (q) {
    andFilters.push({
      OR: [
        {
          invoice: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          uid: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          whatsapp: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          providerRefId: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          providerRc: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          providerSn: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          providerMessage: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          product: {
            name: {
              contains: q,
              mode: "insensitive",
            },
          },
        },
        {
          product: {
            sku: {
              contains: q,
              mode: "insensitive",
            },
          },
        },
        {
          product: {
            providerCode: {
              contains: q,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (paymentStatus) {
    andFilters.push({
      paymentStatus,
    });
  }

  if (providerStatus) {
    andFilters.push({
      providerStatus,
    });
  }

  const fromDate =
    parseJakartaDateStart(from);

  const toDate =
    parseJakartaDateEnd(to);

  if (fromDate) {
    andFilters.push({
      createdAt: {
        gte: fromDate,
      },
    });
  }

  if (toDate) {
    andFilters.push({
      createdAt: {
        lt: toDate,
      },
    });
  }

  const where: Prisma.OrderWhereInput =
    andFilters.length > 0
      ? {
          AND: andFilters,
        }
      : {};

  const orderBy =
    sort === "oldest"
      ? {
          createdAt: "asc" as const,
        }
      : {
          createdAt: "desc" as const,
        };

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    paidOrders,
    pendingTopup,
    successTopup,
    failedTopup,
    revenueResult,
    filteredCount,
    filteredOrders,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.product.count({
      where: {
        active: true,
      },
    }),

    prisma.order.count(),

    prisma.order.count({
      where: {
        paymentStatus: "PAID",
      },
    }),

    prisma.order.count({
      where: {
        providerStatus: {
          in: [
            "PENDING",
            "PROCESSING",
          ],
        },
      },
    }),

    prisma.order.count({
      where: {
        providerStatus:
          "SUCCESS",
      },
    }),

    prisma.order.count({
      where: {
        providerStatus:
          "FAILED",
      },
    }),

    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
      },
      _sum: {
        total: true,
      },
    }),

    prisma.order.count({
      where,
    }),

    prisma.order.findMany({
      where,
      skip:
        (page - 1) *
        limit,
      take: limit,
      orderBy,
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            providerCode: true,
          },
        },

        payment: {
          select: {
            paymentType: true,
            status: true,
            grossAmount: true,
            paidAt: true,
          },
        },
      },
    }),
  ]);

  const revenue =
    revenueResult._sum
      .total ?? 0;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCount /
          limit,
      ),
    );

  const safePage = Math.min(
    page,
    totalPages,
  );

  function buildPageUrl(
    targetPage: number,
  ) {
    const search =
      new URLSearchParams();

    if (q) {
      search.set(
        "q",
        q,
      );
    }

    if (paymentStatus) {
      search.set(
        "paymentStatus",
        paymentStatus,
      );
    }

    if (providerStatus) {
      search.set(
        "providerStatus",
        providerStatus,
      );
    }

    if (from) {
      search.set(
        "from",
        from,
      );
    }

    if (to) {
      search.set(
        "to",
        to,
      );
    }

    if (sort) {
      search.set(
        "sort",
        sort,
      );
    }

    search.set(
      "limit",
      String(limit),
    );

    search.set(
      "page",
      String(targetPage),
    );

    return `/admin?${search.toString()}`;
  }

  const firstItem =
    filteredCount === 0
      ? 0
      : (safePage - 1) *
          limit +
        1;

  const lastItem =
    Math.min(
      safePage * limit,
      filteredCount,
    );

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-10 text-white">
      <div className="mx-auto max-w-[1800px]">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              Admin Dashboard
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              7 April Store
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Monitoring pembayaran,
              transaksi Digiflazz,
              riwayat pesanan,
              dan waktu pemrosesan
              lengkap.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-bold transition hover:bg-white/10"
            >
              Lihat Website
            </Link>

            <Link
              href="/admin/account-products"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20"
            >
              🎮 Kelola Akun Game
            </Link>

            <Link
              href="/admin/promos"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 text-sm font-bold text-violet-300 transition hover:bg-violet-500/20"
            >
              🎟 Kelola Promo
            </Link>

            <Link
              href="/topup/free-fire"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold transition hover:bg-blue-500"
            >
              Halaman Top Up
            </Link>

            <AdminLogoutButton />
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <DashboardCard
            icon="📦"
            label="Produk Aktif"
            value={String(
              activeProducts,
            )}
            description={`dari ${totalProducts} produk`}
          />

          <DashboardCard
            icon="🧾"
            label="Total Pesanan"
            value={String(
              totalOrders,
            )}
            description="seluruh transaksi"
          />

          <DashboardCard
            icon="💳"
            label="Pembayaran"
            value={String(
              paidOrders,
            )}
            description="transaksi PAID"
            valueClass="text-green-400"
          />

          <DashboardCard
            icon="⏳"
            label="Top Up Pending"
            value={String(
              pendingTopup,
            )}
            description="pending / processing"
            valueClass="text-yellow-400"
          />

          <DashboardCard
            icon="✅"
            label="Top Up Sukses"
            value={String(
              successTopup,
            )}
            description="provider SUCCESS"
            valueClass="text-green-400"
          />

          <DashboardCard
            icon="❌"
            label="Top Up Gagal"
            value={String(
              failedTopup,
            )}
            description="provider FAILED"
            valueClass="text-red-400"
          />

          <DashboardCard
            icon="💰"
            label="Dibayar"
            value={formatRupiah(
              revenue,
            )}
            description="total order PAID"
            valueClass="text-green-400"
            small
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
          <div className="border-b border-white/10 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Filter Riwayat Transaksi
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Cari transaksi berdasarkan
                  invoice, UID, WhatsApp,
                  Ref ID, SN, produk,
                  status, atau tanggal.
                </p>
              </div>

              <Link
                href="/admin"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold transition hover:bg-white/10"
              >
                Reset Filter
              </Link>
            </div>

            <form
              method="get"
              className="mt-6 grid gap-4 lg:grid-cols-12"
            >
              <div className="lg:col-span-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pencarian
                </label>

                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Invoice / UID / WhatsApp / Ref ID / SN..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dari Tanggal
                </label>

                <input
                  type="date"
                  name="from"
                  defaultValue={from}
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Sampai Tanggal
                </label>

                <input
                  type="date"
                  name="to"
                  defaultValue={to}
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Payment
                </label>

                <select
                  name="paymentStatus"
                  defaultValue={
                    paymentStatus
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    Semua Payment
                  </option>
                  <option value="PENDING">
                    PENDING
                  </option>
                  <option value="PAID">
                    PAID
                  </option>
                  <option value="REFUNDED">
                    REFUNDED
                  </option>
                  <option value="PARTIAL_REFUND">
                    PARTIAL REFUND
                  </option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Provider
                </label>

                <select
                  name="providerStatus"
                  defaultValue={
                    providerStatus
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    Semua Provider
                  </option>
                  <option value="PENDING">
                    PENDING
                  </option>
                  <option value="PROCESSING">
                    PROCESSING
                  </option>
                  <option value="SUCCESS">
                    SUCCESS
                  </option>
                  <option value="FAILED">
                    FAILED
                  </option>
                  <option value="REFUND_REQUIRED">
                    REFUND_REQUIRED
                  </option>
                  <option value="REFUND_PROCESSING">
                    REFUND_PROCESSING
                  </option>
                  <option value="REFUNDED">
                    REFUNDED
                  </option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Urutan
                </label>

                <select
                  name="sort"
                  defaultValue={
                    sort
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="newest">
                    Terbaru
                  </option>
                  <option value="oldest">
                    Terlama
                  </option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Per Halaman
                </label>

                <select
                  name="limit"
                  defaultValue={String(
                    limit,
                  )}
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="25">
                    25
                  </option>
                  <option value="50">
                    50
                  </option>
                  <option value="100">
                    100
                  </option>
                </select>
              </div>

              <div className="flex items-end lg:col-span-2">
                <button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-blue-600 px-5 text-sm font-bold transition hover:bg-blue-500"
                >
                  Terapkan Filter
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.02] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-white">
                Menampilkan{" "}
                {firstItem}–
                {lastItem} dari{" "}
                {filteredCount} transaksi
              </p>

              {(from ||
                to ||
                q ||
                paymentStatus ||
                providerStatus) && (
                <p className="mt-1 text-xs text-slate-500">
                  Filter aktif
                  berdasarkan
                  parameter pencarian
                  di atas.
                </p>
              )}
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Database Online
            </div>
          </div>

          {filteredOrders.length >
          0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[2700px] text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-medium">
                      Invoice
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Produk
                    </th>

                    <th className="px-5 py-4 font-medium">
                      UID
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Total
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Payment
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Provider
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Ref ID
                    </th>

                    <th className="px-5 py-4 font-medium">
                      RC
                    </th>

                    <th className="px-5 py-4 font-medium">
                      SN
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Harga Provider
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Dibuat
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Dibayar
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Update Provider
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Terakhir Diubah
                    </th>

                    <th className="px-5 py-4 font-medium">
                      History
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Pesan Provider
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (order) => {
                      const history =
                        getHistoryEvents(
                          order,
                        );

                      return (
                        <tr
                          key={
                            order.id
                          }
                          className="border-b border-white/5 text-sm last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-5 align-top">
                            <Link
                              href={`/order/${order.invoice}`}
                              className="font-bold text-blue-400 hover:text-blue-300"
                            >
                              {
                                order.invoice
                              }
                            </Link>

                            <p className="mt-2 text-xs text-slate-600">
                              {maskWhatsapp(
                                order.whatsapp,
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-semibold">
                              {
                                order
                                  .product
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                order
                                  .product
                                  .sku
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              {
                                order
                                  .product
                                  .providerCode
                              }
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top font-medium text-slate-300">
                            {maskUid(
                              order.uid,
                            )}
                          </td>

                          <td className="px-5 py-5 align-top font-bold">
                            {formatRupiah(
                              order.total,
                            )}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span
                              className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                order.paymentStatus,
                              )}`}
                            >
                              {
                                order.paymentStatus
                              }
                            </span>

                            {order.payment?.paymentType && (
                              <p className="mt-2 text-xs text-slate-500">
                                {
                                  order
                                    .payment
                                    .paymentType
                                }
                              </p>
                            )}

                            {order.payment?.grossAmount !==
                              undefined &&
                              order.payment
                                ?.grossAmount !==
                                null && (
                                <p className="mt-2 text-xs font-semibold text-slate-400">
                                  Gross{" "}
                                  {formatRupiah(
                                    order.payment.grossAmount,
                                  )}
                                </p>
                              )}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span
                              className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                order.providerStatus,
                              )}`}
                            >
                              {
                                order.providerStatus
                              }
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="break-all font-mono text-xs text-slate-300">
                              {order.providerRefId ??
                                "-"}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="font-mono text-xs text-slate-300">
                              {order.providerRc ??
                                "-"}
                            </span>
                          </td>

                          <td className="max-w-[240px] px-5 py-5 align-top">
                            {order.providerSn ? (
                              <span className="break-all font-mono text-xs leading-5 text-green-400">
                                {
                                  order.providerSn
                                }
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                -
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-5 align-top font-semibold">
                            {order.providerActualPrice !==
                              null &&
                            order.providerActualPrice !==
                              undefined
                              ? formatRupiah(
                                  order.providerActualPrice,
                                )
                              : "-"}
                          </td>

                          <td className="min-w-[190px] px-5 py-5 align-top">
                            <p className="text-xs font-semibold text-slate-300">
                              {formatDateTime(
                                order.createdAt,
                              )}
                            </p>
                          </td>

                          <td className="min-w-[190px] px-5 py-5 align-top">
                            <p className="text-xs font-semibold text-slate-300">
                              {formatDateTime(
                                order.payment?.paidAt ??
                                  null,
                              )}
                            </p>
                          </td>

                          <td className="min-w-[190px] px-5 py-5 align-top">
                            <p className="text-xs font-semibold text-slate-300">
                              {formatDateTime(
                                order.providerUpdatedAt ??
                                  null,
                              )}
                            </p>
                          </td>

                          <td className="min-w-[190px] px-5 py-5 align-top">
                            <p className="text-xs font-semibold text-slate-300">
                              {formatDateTime(
                                order.updatedAt,
                              )}
                            </p>
                          </td>

                          <td className="min-w-[280px] px-5 py-5 align-top">
                            <div className="space-y-3">
                              {history.map(
                                (
                                  event,
                                  index,
                                ) => (
                                  <div
                                    key={`${event.label}-${event.date.toISOString()}-${index}`}
                                    className="flex gap-3"
                                  >
                                    <div className="flex flex-col items-center">
                                      <span
                                        className={`mt-1 h-2.5 w-2.5 rounded-full ${event.className}`}
                                      />

                                      {index <
                                        history.length -
                                          1 && (
                                        <span className="mt-1 h-full w-px bg-white/10" />
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-300">
                                        {
                                          event.label
                                        }
                                      </p>

                                      <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                        {formatDateTime(
                                          event.date,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ),
                              )}

                              <Link
                                href={`/order/${order.invoice}`}
                                className="inline-flex text-xs font-bold text-blue-400 hover:text-blue-300"
                              >
                                Buka Detail →
                              </Link>
                            </div>
                          </td>

                          <td className="max-w-[360px] px-5 py-5 align-top">
                            <p
                              className="line-clamp-4 text-xs leading-5 text-slate-400"
                              title={
                                order.providerMessage ??
                                ""
                              }
                            >
                              {order.providerMessage ??
                                "-"}
                            </p>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="text-4xl">
                🔎
              </div>

              <p className="mt-4 font-bold">
                Tidak ada transaksi
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Coba ubah filter atau
                rentang tanggal.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Halaman{" "}
              {safePage} dari{" "}
              {totalPages}
            </p>

            <div className="flex flex-wrap gap-2">
              {safePage > 1 && (
                <Link
                  href={buildPageUrl(
                    safePage - 1,
                  )}
                  className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold transition hover:bg-white/10"
                >
                  ← Sebelumnya
                </Link>
              )}

              {safePage <
                totalPages && (
                <Link
                  href={buildPageUrl(
                    safePage + 1,
                  )}
                  className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold transition hover:bg-blue-500"
                >
                  Berikutnya →
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard
            label="Database"
            title="Prisma + PostgreSQL"
          >
            Seluruh pesanan yang
            tersimpan dapat dicari
            berdasarkan invoice,
            UID, WhatsApp,
            produk, Ref ID, RC,
            SN, dan pesan provider.
          </InfoCard>

          <InfoCard
            label="Waktu"
            title="Timestamp Lengkap WIB"
          >
            Dashboard sekarang
            menampilkan waktu
            pesanan dibuat,
            pembayaran PAID,
            update provider,
            dan waktu terakhir
            order diubah.
          </InfoCard>

          <InfoCard
            label="Riwayat"
            title="Detail Transaksi"
          >
            Gunakan tombol Detail
            pada setiap invoice
            untuk membuka halaman
            transaksi dan melihat
            data order yang
            tersimpan.
          </InfoCard>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          7 April Store • Gaming
          Marketplace Administration
        </p>
      </div>
    </main>
  );
}

function DashboardCard({
  icon,
  label,
  value,
  description,
  valueClass = "",
  small = false,
}: {
  icon: string;
  label: string;
  value: string;
  description: string;
  valueClass?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
        {icon}
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 font-black ${
          small
            ? "text-xl"
            : "text-3xl"
        } ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <h3 className="mt-3 text-lg font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {children}
      </p>
    </div>
  );
}