import type { Metadata } from "next";
import PromoBannerCarousel from "@/components/ads/PromoBannerCarousel";
import WhatsAppPromoBanner from "@/components/ads/WhatsAppPromoBanner";
import SiteFooter from "@/components/layout/SiteFooter";
import { prisma } from "@/lib/prisma";
import { getEffectiveSellingPrice } from "@/lib/pricing";

import OrderStatusCheck from "./OrderStatusCheck";
import RecentOrders from "./RecentOrders";
import FreeFireReviews from "./FreeFireReviews";
import TopUpClient from "./TopUpClient";

export const metadata: Metadata = {
  title: "Top Up Diamond Free Fire Murah",
  description:
    "Top up Diamond Free Fire murah dan cepat di 7 April Store. Pilih nominal, masukkan UID Free Fire, bayar QRIS, dan cek status pesanan.",
  keywords: [
    "top up Diamond Free Fire",
    "top up Free Fire murah",
    "top up FF murah",
    "beli Diamond FF",
    "top up FF QRIS",
  ],
  alternates: { canonical: "https://store.falintino.com/topup/free-fire" },
  openGraph: {
    title: "Top Up Diamond Free Fire Murah | 7 April Store",
    description:
      "Pilih nominal Diamond Free Fire, bayar dengan QRIS, dan pantau status pesanan di 7 April Store.",
    url: "https://store.falintino.com/topup/free-fire",
  },
};

export const dynamic = "force-dynamic";

export default async function FreeFireTopUpPage() {
  // Pastikan produk kecil ini tersedia di database produksi.
  // Harga modal diverifikasi dari daftar Digiflazz Buyer:
  // FF15 = Rp2.174 dan FF60 = Rp7.245.
  await Promise.all([
    prisma.product.upsert({
      where: { sku: "FF15" },
      update: {
        game: "Free Fire",
        name: "15 Diamond",
        providerCode: "ff15",
        price: 2250,
        providerPrice: 2174,
        active: true,
      },
      create: {
        game: "Free Fire",
        name: "15 Diamond",
        sku: "FF15",
        providerCode: "ff15",
        price: 2250,
        providerPrice: 2174,
        popular: false,
        active: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: "FF60" },
      update: {
        game: "Free Fire",
        name: "60 Diamond",
        providerCode: "ff60",
        price: 7623,
        providerPrice: 7245,
        active: true,
      },
      create: {
        game: "Free Fire",
        name: "60 Diamond",
        sku: "FF60",
        providerCode: "ff60",
        price: 7623,
        providerPrice: 7245,
        popular: false,
        active: true,
      },
    }),
  ]);

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
      providerPrice: true,
      popular: true,
    },
  });

  // Harga khusus mengikuti modal provider terbaru.
  const displayProducts = products.map((product) => {
    const fixedPrices: Record<string, number> = {
      FF15: 2250,
      FF40: 5690,
      FF50: 5950,
      FF60: 7623,
      FF250: 30547,
      FF2160: 246190,
      FF2180: 248650,
      FF2000: 229791,
      FF1450: 165613,
      FF1440: 164123,
      FF1075: 123100,
    };

    const basePrice = fixedPrices[product.sku] ?? product.price;
    const effectivePrice = getEffectiveSellingPrice({
      name: product.name,
      sku: product.sku,
      providerPrice: product.providerPrice,
      fallbackPrice: basePrice,
    });

    return { ...product, price: effectivePrice };
  });

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <PromoBannerCarousel />
      <WhatsAppPromoBanner />

      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-blue-400/20 bg-slate-950 shadow-2xl">
          <img src="/free-fire-banner.svg" alt="Banner 7 April Store untuk top up Diamond Free Fire" className="block h-auto max-h-[360px] w-full object-cover" />
        </div>
      </section>

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
                🔒 Pembayaran QRIS melalui Midtrans
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                💎 Diproses Setelah Pembayaran
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pb-16 sm:pb-20">
        <TopUpClient products={displayProducts} />

        <OrderStatusCheck />

        <RecentOrders />
        <FreeFireReviews />
      </div>

      <SiteFooter />
    </main>
  );
}
