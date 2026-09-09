import PromoBannerCarousel from "@/components/ads/PromoBannerCarousel";
import SiteFooter from "@/components/layout/SiteFooter";
import { prisma } from "@/lib/prisma";

import OrderStatusCheck from "./OrderStatusCheck";
import RecentOrders from "./RecentOrders";
import TopUpClient from "./TopUpClient";

export default async function FreeFireTopUpPage() {
  const products = await prisma.product.findMany({
    where: {
      game: "Free Fire",
      active: true,
    },
    orderBy: [
      {
        popular: "desc",
      },
      {
        price: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      popular: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <PromoBannerCarousel />

      <section className="border-y border-white/10 bg-gradient-to-b from-blue-950/30 to-[#030712]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Top Up Free Fire
            </span>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
              Top Up Diamond Free Fire
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Masukkan UID, pilih nominal diamond, lalu lanjutkan ke
              pembayaran. Pesanan akan diproses setelah pembayaran berhasil.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                ⚡ Proses Cepat
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                🔒 Transaksi Aman
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                💎 Diamond Otomatis
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pb-16 sm:pb-20">
        <TopUpClient products={products} />

        <OrderStatusCheck />

        <RecentOrders />
      </div>

      <SiteFooter />
    </main>
  );
}