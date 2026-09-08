import crypto from "crypto";

import Link from "next/link";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import AdminLogoutButton from "./AdminLogoutButton";

export const dynamic = "force-dynamic";

const ADMIN_COOKIE_NAME =
  "admin_session";

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

function formatRupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }
  ).format(value);
}

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone:
        "Asia/Jakarta",
    }
  ).format(date);
}

function maskUid(
  uid: string
) {
  if (uid.length <= 4) {
    return "****";
  }

  return `${uid.slice(
    0,
    3
  )}****${uid.slice(-2)}`;
}

function maskWhatsapp(
  whatsapp: string
) {
  if (
    whatsapp.length <= 6
  ) {
    return "********";
  }

  return `${whatsapp.slice(
    0,
    4
  )}****${whatsapp.slice(-3)}`;
}

function getStatusClass(
  status: string
) {
  if (
    status === "PAID" ||
    status === "SUCCESS"
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

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
}

export default async function AdminPage() {
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

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    paidOrders,
    pendingTopup,
    successTopup,
    failedTopup,
    revenueResult,
    recentOrders,
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
        paymentStatus:
          "PAID",
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
        paymentStatus:
          "PAID",
      },

      _sum: {
        total: true,
      },
    }),

    prisma.order.findMany({
      take: 15,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        product: {
          select: {
            name: true,
            sku: true,
            providerCode: true,
          },
        },
      },
    }),
  ]);

  const revenue =
    revenueResult._sum
      .total ?? 0;

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-10 text-white">
      <div className="mx-auto max-w-[1500px]">
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
              transaksi Digiflazz, dan
              bukti pemrosesan top up.
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
              activeProducts
            )}
            description={`dari ${totalProducts} produk`}
          />

          <DashboardCard
            icon="🧾"
            label="Total Pesanan"
            value={String(
              totalOrders
            )}
            description="seluruh transaksi"
          />

          <DashboardCard
            icon="💳"
            label="Pembayaran"
            value={String(
              paidOrders
            )}
            description="transaksi PAID"
            valueClass="text-green-400"
          />

          <DashboardCard
            icon="⏳"
            label="Top Up Pending"
            value={String(
              pendingTopup
            )}
            description="pending / processing"
            valueClass="text-yellow-400"
          />

          <DashboardCard
            icon="✅"
            label="Top Up Sukses"
            value={String(
              successTopup
            )}
            description="provider SUCCESS"
            valueClass="text-green-400"
          />

          <DashboardCard
            icon="❌"
            label="Top Up Gagal"
            value={String(
              failedTopup
            )}
            description="provider FAILED"
            valueClass="text-red-400"
          />

          <DashboardCard
            icon="💰"
            label="Dibayar"
            value={formatRupiah(
              revenue
            )}
            description="total order PAID"
            valueClass="text-green-400"
            small
          />
        </section>

        <section className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
            <div className="flex flex-col gap-3 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Monitoring Transaksi
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Status pembayaran dan
                  bukti transaksi
                  provider dari database.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Database Online
              </div>
            </div>

            {recentOrders.length >
            0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1700px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
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
                        Pesan Provider
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Waktu
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map(
                      (
                        order
                      ) => (
                        <tr
                          key={
                            order.id
                          }
                          className="border-b border-white/5 text-sm last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/order/${order.invoice}`}
                              className="font-bold text-blue-400 hover:text-blue-300"
                            >
                              {
                                order.invoice
                              }
                            </Link>

                            <p className="mt-1 text-xs text-slate-600">
                              {maskWhatsapp(
                                order.whatsapp
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
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
                                  .providerCode
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-300">
                            {maskUid(
                              order.uid
                            )}
                          </td>

                          <td className="px-5 py-4 font-bold">
                            {formatRupiah(
                              order.total
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                order.paymentStatus
                              )}`}
                            >
                              {
                                order.paymentStatus
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                order.providerStatus
                              )}`}
                            >
                              {
                                order.providerStatus
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-slate-300">
                              {order.providerRefId ??
                                "-"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-slate-300">
                              {order.providerRc ??
                                "-"}
                            </span>
                          </td>

                          <td className="max-w-[220px] px-5 py-4">
                            {order.providerSn ? (
                              <span className="break-all font-mono text-xs text-green-400">
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

                          <td className="px-5 py-4 font-semibold">
                            {order.providerActualPrice !==
                            null
                              ? formatRupiah(
                                  order.providerActualPrice
                                )
                              : "-"}
                          </td>

                          <td className="max-w-[300px] px-5 py-4">
                            <p
                              className="line-clamp-3 text-xs leading-5 text-slate-400"
                              title={
                                order.providerMessage ??
                                ""
                              }
                            >
                              {order.providerMessage ??
                                "-"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-400">
                            {formatDate(
                              order.providerUpdatedAt ??
                                order.createdAt
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="font-bold">
                  Belum ada transaksi
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Pesanan baru akan muncul
                  di sini.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard
            label="Database"
            title="Prisma + PostgreSQL"
          >
            Order, pembayaran,
            status provider, Ref
            ID, SN, RC, dan
            respons transaksi
            disimpan di database.
          </InfoCard>

          <InfoCard
            label="Payment Gateway"
            title="Midtrans"
          >
            Hanya pembayaran
            yang sudah
            terverifikasi PAID
            oleh server yang
            boleh diteruskan ke
            provider.
          </InfoCard>

          <InfoCard
            label="Provider"
            title="Digiflazz"
          >
            Transaksi
            menggunakan invoice
            sebagai ref_id agar
            setiap order
            mempunyai referensi
            provider yang
            konsisten.
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
  children:
    React.ReactNode;
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