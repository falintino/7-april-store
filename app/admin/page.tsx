import crypto from "crypto";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

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

  if (status === "PROCESSING") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }

  if (
    status === "REFUND_REQUIRED" ||
    status === "REFUND_PROCESSING" ||
    status === "REFUND_PENDING"
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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

  const filters: Prisma.OrderWhereInput[] =
    [];

  if (q) {
    filters.push({
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
    filters.push({
      paymentStatus,
    });
  }

  if (providerStatus) {
    filters.push({
      providerStatus,
    });
  }

  const fromDate =
    parseJakartaDateStart(from);

  const toDate =
    parseJakartaDateEnd(to);

  if (fromDate) {
    filters.push({
      createdAt: {
        gte: fromDate,
      },
    });
  }

  if (toDate) {
    filters.push({
      createdAt: {
        lt: toDate,
      },
    });
  }

  const where: Prisma.OrderWhereInput =
    filters.length > 0
      ? {
          AND: filters,
        }
      : {};

  const orderBy =
    sort === "oldest"
      ? {
          createdAt:
            "asc" as const,
        }
      : {
          createdAt:
            "desc" as const,
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
        providerStatus: "SUCCESS",
      },
    }),

    prisma.order.count({
      where: {
        providerStatus: "FAILED",
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
        (page - 1) * limit,
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
    revenueResult._sum.total ??
    0;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredCount /
          limit,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

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

    search.set(
      "sort",
      sort,
    );

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

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-[1800px]">

        {/* HEADER */}
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Admin Dashboard
            </span>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              7 April Store
            </h1>

            <p className="mt-1.5 text-sm text-slate-400">
              Monitoring pembayaran,
              transaksi Digiflazz,
              dan riwayat pesanan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-bold transition hover:bg-white/10"
            >
              Lihat Website
            </Link>

            <Link
              href="/admin/account-products"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 text-xs font-bold text-blue-300 transition hover:bg-blue-500/20"
            >
              🎮 Kelola Akun
            </Link>

            <Link
              href="/admin/promos"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 text-xs font-bold text-violet-300 transition hover:bg-violet-500/20"
            >
              🎟 Promo
            </Link>

            <Link
              href="/topup/free-fire"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-bold transition hover:bg-blue-500"
            >
              Halaman Top Up
            </Link>

            <AdminLogoutButton />
          </div>
        </div>

        {/* STATISTICS */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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

        {/* FILTER */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">

          <div className="border-b border-white/10 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black">
                  Filter Riwayat Transaksi
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Cari berdasarkan invoice,
                  UID, WhatsApp, Ref ID,
                  SN, produk, status,
                  atau tanggal.
                </p>
              </div>

              <Link
                href="/admin"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold transition hover:bg-white/10"
              >
                Reset Filter
              </Link>
            </div>

            <form
              method="get"
              className="mt-4 grid gap-3 lg:grid-cols-12"
            >
              <div className="lg:col-span-4">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pencarian
                </label>

                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Invoice / UID / WhatsApp / Ref ID / SN..."
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Dari Tanggal
                </label>

                <input
                  type="date"
                  name="from"
                  defaultValue={from}
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Sampai Tanggal
                </label>

                <input
                  type="date"
                  name="to"
                  defaultValue={to}
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Payment
                </label>

                <select
                  name="paymentStatus"
                  defaultValue={
                    paymentStatus
                  }
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-blue-500"
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
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Provider
                </label>

                <select
                  name="providerStatus"
                  defaultValue={
                    providerStatus
                  }
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-blue-500"
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
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Urutan
                </label>

                <select
                  name="sort"
                  defaultValue={sort}
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-blue-500"
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
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Per Halaman
                </label>

                <select
                  name="limit"
                  defaultValue={String(
                    limit,
                  )}
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-blue-500"
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
                  className="h-10 w-full rounded-lg bg-blue-600 px-4 text-xs font-bold transition hover:bg-blue-500"
                >
                  Terapkan Filter
                </button>
              </div>
            </form>
          </div>

          {/* RESULT BAR */}
          <div className="flex flex-col gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-slate-300">
              Menampilkan{" "}
              {firstItem}–
              {lastItem} dari{" "}
              {filteredCount} transaksi
            </p>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1.5 text-[10px] font-bold text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Database Online
            </div>
          </div>

          {/* TABLE */}
          {filteredOrders.length >
          0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[2100px] text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/70 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Invoice
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Produk
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      UID
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Total
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Payment
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Provider
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Ref ID
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      RC
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      SN
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Harga Provider
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Waktu
                    </th>

                    <th className="whitespace-nowrap px-3 py-3 font-semibold">
                      Detail
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className="border-b border-white/5 text-xs transition hover:bg-white/[0.025]"
                      >
                        {/* INVOICE */}
                        <td className="px-3 py-3 align-top">
                          <Link
                            href={`/order/${order.invoice}`}
                            className="font-bold leading-5 text-blue-400 hover:text-blue-300"
                          >
                            {order.invoice}
                          </Link>

                          <p className="mt-1 text-[10px] text-slate-600">
                            {maskWhatsapp(
                              order.whatsapp,
                            )}
                          </p>
                        </td>

                        {/* PRODUCT */}
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold leading-5 text-white">
                            {
                              order
                                .product
                                .name
                            }
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {
                              order
                                .product
                                .sku
                            }
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {
                              order
                                .product
                                .providerCode
                            }
                          </p>
                        </td>

                        {/* UID */}
                        <td className="whitespace-nowrap px-3 py-3 align-top font-medium text-slate-300">
                          {maskUid(
                            order.uid,
                          )}
                        </td>

                        {/* TOTAL */}
                        <td className="whitespace-nowrap px-3 py-3 align-top font-bold text-white">
                          {formatRupiah(
                            order.total,
                          )}
                        </td>

                        {/* PAYMENT */}
                        <td className="px-3 py-3 align-top">
                          <span
                            className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${getStatusClass(
                              order.paymentStatus,
                            )}`}
                          >
                            {
                              order.paymentStatus
                            }
                          </span>

                          {order.payment
                            ?.paymentType && (
                            <p className="mt-1 text-[10px] text-slate-600">
                              {
                                order
                                  .payment
                                  .paymentType
                              }
                            </p>
                          )}

                          {order.payment
                            ?.grossAmount !==
                            undefined &&
                            order
                              .payment
                              ?.grossAmount !==
                              null && (
                              <p className="mt-1 whitespace-nowrap text-[10px] text-slate-500">
                                Gross{" "}
                                {formatRupiah(
                                  order
                                    .payment
                                    .grossAmount,
                                )}
                              </p>
                            )}
                        </td>

                        {/* PROVIDER STATUS */}
                        <td className="px-3 py-3 align-top">
                          <span
                            className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${getStatusClass(
                              order.providerStatus,
                            )}`}
                          >
                            {
                              order.providerStatus
                            }
                          </span>
                        </td>

                        {/* REF ID */}
                        <td className="max-w-[150px] px-3 py-3 align-top">
                          <span className="break-all font-mono text-[10px] leading-4 text-slate-400">
                            {order.providerRefId ??
                              "-"}
                          </span>
                        </td>

                        {/* RC */}
                        <td className="px-3 py-3 align-top">
                          <span className="font-mono text-[10px] text-slate-300">
                            {order.providerRc ??
                              "-"}
                          </span>
                        </td>

                        {/* SN */}
                        <td className="max-w-[220px] px-3 py-3 align-top">
                          {order.providerSn ? (
                            <p className="line-clamp-2 break-all font-mono text-[10px] leading-4 text-green-400">
                              {
                                order.providerSn
                              }
                            </p>
                          ) : (
                            <span className="text-slate-600">
                              -
                            </span>
                          )}
                        </td>

                        {/* PROVIDER PRICE */}
                        <td className="whitespace-nowrap px-3 py-3 align-top font-semibold text-slate-200">
                          {order.providerActualPrice !==
                            null &&
                          order.providerActualPrice !==
                            undefined
                            ? formatRupiah(
                                order.providerActualPrice,
                              )
                            : "-"}
                        </td>

                        {/* TIME */}
                        <td className="min-w-[245px] px-3 py-3 align-top">
                          <div className="space-y-1.5">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                                Dibuat
                              </p>

                              <p className="text-[10px] leading-4 text-slate-300">
                                {formatDateTime(
                                  order.createdAt,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-green-500/70">
                                Dibayar
                              </p>

                              <p className="text-[10px] leading-4 text-slate-300">
                                {formatDateTime(
                                  order
                                    .payment
                                    ?.paidAt ??
                                    null,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-blue-500/70">
                                Provider
                              </p>

                              <p className="text-[10px] leading-4 text-slate-300">
                                {formatDateTime(
                                  order.providerUpdatedAt ??
                                    null,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-violet-500/70">
                                Terakhir
                              </p>

                              <p className="text-[10px] leading-4 text-slate-300">
                                {formatDateTime(
                                  order.updatedAt,
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* DETAIL */}
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/order/${order.invoice}`}
                              className="inline-flex h-8 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10 px-3 text-[10px] font-bold text-blue-300 transition hover:bg-blue-500/20"
                            >
                              Detail
                            </Link>

                            {order.providerMessage && (
                              <span
                                title={
                                  order.providerMessage
                                }
                                className="line-clamp-2 max-w-[180px] text-[10px] leading-4 text-slate-500"
                              >
                                {
                                  order.providerMessage
                                }
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-3xl">
                🔎
              </div>

              <p className="mt-3 text-sm font-bold">
                Tidak ada transaksi
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Coba ubah filter atau
                rentang tanggal.
              </p>
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-slate-500">
              Halaman{" "}
              {safePage} dari{" "}
              {totalPages}
            </p>

            <div className="flex gap-2">
              {safePage > 1 && (
                <Link
                  href={buildPageUrl(
                    safePage - 1,
                  )}
                  className="inline-flex h-8 items-center rounded-md border border-white/10 bg-white/5 px-3 text-[10px] font-bold transition hover:bg-white/10"
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
                  className="inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-[10px] font-bold transition hover:bg-blue-500"
                >
                  Berikutnya →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* INFO */}
        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <InfoCard
            label="Database"
            title="Prisma + PostgreSQL"
          >
            Semua transaksi bisa
            dicari menggunakan
            invoice, UID, WhatsApp,
            Ref ID, RC, SN,
            produk, atau pesan
            provider.
          </InfoCard>

          <InfoCard
            label="Waktu"
            title="Timestamp Lengkap"
          >
            Menampilkan waktu
            dibuat, dibayar,
            update provider, dan
            terakhir diubah sampai
            detik dalam WIB.
          </InfoCard>

          <InfoCard
            label="Riwayat"
            title="Detail Per Invoice"
          >
            Klik tombol Detail
            untuk membuka seluruh
            informasi transaksi
            tanpa membuat tabel
            utama terlalu tinggi.
          </InfoCard>
        </section>

        <p className="mt-5 text-center text-[10px] text-slate-700">
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
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-lg">
        {icon}
      </div>

      <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 font-black ${
          small
            ? "text-lg"
            : "text-2xl"
        } ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-0.5 text-[10px] text-slate-500">
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
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <h3 className="mt-2 text-sm font-black">
        {title}
      </h3>

      <p className="mt-1.5 text-xs leading-5 text-slate-400">
        {children}
      </p>
    </div>
  );
}