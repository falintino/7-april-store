import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  Mail,
  Phone,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWhatsapp(value: string) {
  if (value.startsWith("62")) {
    return `0${value.slice(2)}`;
  }

  return value;
}

function getStatusStyle(status: string) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "PAID" || normalizedStatus === "SUCCESS") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (
    normalizedStatus === "FAILED" ||
    normalizedStatus === "EXPIRED" ||
    normalizedStatus === "CANCELLED"
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

export default async function ProfilPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const customer = await prisma.customer.findUnique({
    where: {
      id: session.id,
    },
    select: {
      name: true,
      email: true,
      whatsapp: true,
      createdAt: true,
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          invoice: true,
          uid: true,
          server: true,
          total: true,
          paymentStatus: true,
          providerStatus: true,
          createdAt: true,
          product: {
            select: {
              game: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    redirect("/api/auth/logout");
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#030712] px-5 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-6 sm:p-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">
              Akun Pelanggan
            </p>

            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              Halo, {customer.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Lihat informasi akun dan pantau pesanan yang dibuat saat kamu
              sedang login.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/topup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Top Up Sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>

            <LogoutButton />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-950 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-white">Informasi Akun</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Data yang digunakan saat mendaftar
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <UserRound className="h-4 w-4" />
                  Nama
                </div>
                <p className="mt-2 font-semibold text-white">{customer.name}</p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <p className="mt-2 break-all font-semibold text-white">
                  {customer.email}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </div>
                <p className="mt-2 font-semibold text-white">
                  {formatWhatsapp(customer.whatsapp)}
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Bergabung sejak{" "}
              {customer.createdAt.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <ClipboardList className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-white">Pesanan Saya</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Maksimal 20 pesanan terbaru
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-400">
                {customer.orders.length} Pesanan
              </span>
            </div>

            {customer.orders.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <ShoppingBag className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-white">
                  Belum ada pesanan di akun ini
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Pesanan yang dibuat setelah kamu login akan tampil di halaman
                  ini.
                </p>

                <Link
                  href="/topup"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Mulai Top Up
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.07]">
                {customer.orders.map((order) => (
                  <article key={order.id} className="p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white">
                            {order.product.game}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(
                              order.paymentStatus,
                            )}`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {order.product.name}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                          Invoice: {order.invoice}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          ID Game: {order.uid}
                          {order.server ? ` (${order.server})` : ""}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="font-bold text-white">
                          {formatRupiah(order.total)}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {order.createdAt.toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Provider: {order.providerStatus}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}