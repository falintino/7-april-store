import type { Metadata } from "next";
import PromoBannerCarousel from "@/components/ads/PromoBannerCarousel";
import SiteFooter from "@/components/layout/SiteFooter";
import { prisma } from "@/lib/prisma";

import OrderStatusCheck from "./OrderStatusCheck";
import RecentOrders from "./RecentOrders";
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

const whatsappChannelUrl =
  "https://www.whatsapp.com/channel/0029VbByfE60VycAQEP6Tz1b";

function WhatsAppPromoBanner() {
  return (
    <section className="bg-[#030712] px-5 py-5 sm:px-8 sm:py-7">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-emerald-400/40 bg-[radial-gradient(ellipse_at_15%_50%,rgba(34,197,94,0.22),transparent_38%),linear-gradient(115deg,#03170d,#06120e_48%,#031b11)] p-5 shadow-[0_18px_55px_rgba(0,255,100,0.12)] sm:rounded-3xl sm:px-9 sm:py-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-lime-300">
              🎁 Kode Promo 7 April Store
            </span>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Cari Kode Promo
              <span className="block bg-gradient-to-r from-lime-300 via-emerald-300 to-green-500 bg-clip-text text-transparent">
                di Saluran WhatsApp!
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-base">
              Gabung saluran resmi 7 April Store untuk melihat informasi kode
              promo dan kabar promo terbaru.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/90 sm:text-sm">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">🏷️ Info kode promo</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">🎁 Update promo</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">💚 Saluran WhatsApp</span>
            </div>
          </div>
          <a
            href={whatsappChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-xl border border-green-200/40 bg-gradient-to-r from-lime-300 to-emerald-400 px-6 py-4 text-center text-sm font-black uppercase tracking-wide text-green-950 shadow-[0_8px_30px_rgba(34,197,94,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-base"
          >
            <span aria-hidden="true" className="text-2xl">◉</span>
            Gabung Saluran WA
            <span aria-hidden="true" className="text-xl">➜</span>
          </a>
        </div>
      </div>
    </section>
  );
}

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
      popular: true,
    },
  });

  // Harga khusus mengikuti modal provider terbaru.
  const displayProducts = products.map((product) => {
    if (product.sku === "FF250") {
      return { ...product, price: 30547 };
    }
    if (product.sku === "FF2160") {
      return { ...product, price: 246190 };
    }
    if (product.sku === "FF2180") {
      return { ...product, price: 248650 };
    }
    const updatedPrices: Record<string, number> = {
      FF15: 2250,
      FF40: 5690,
      FF50: 5950,
      FF60: 7623,
      FF2000: 229791,
      FF1450: 165613,
      FF1440: 164123,
      FF1075: 123100,
    };
    if (updatedPrices[product.sku] !== undefined) {
      return { ...product, price: updatedPrices[product.sku] };
    }
    return product;
  });

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <PromoBannerCarousel />
      <WhatsAppPromoBanner />

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
      </div>

      <SiteFooter />
    </main>
  );
}
