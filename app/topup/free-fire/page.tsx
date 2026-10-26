import type { Metadata } from "next";
import PromoBannerCarousel from "@/components/ads/PromoBannerCarousel";
import WhatsAppPromoBanner from "@/components/ads/WhatsAppPromoBanner";
import SiteFooter from "@/components/layout/SiteFooter";
import { prisma } from "@/lib/prisma";
import { getEffectiveSellingPrice } from "@/lib/pricing";

import OrderStatusCheck from "./OrderStatusCheck";
import RecentOrders from "./RecentOrders";
import FreeFireLiveActivity from "./FreeFireLiveActivity";
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

  // Hitung hanya order yang pembayarannya PAID dan delivery Digiflazz SUCCESS.
  // Order pending, gagal, refund, atau sekadar dibayar tetapi belum terkirim tidak dihitung.
  const successfulSales = await prisma.order.groupBy({
    by: ["productId"],
    where: {
      paymentStatus: "PAID",
      providerStatus: "SUCCESS",
    },
    _count: { _all: true },
  });
  const soldCountByProductId = new Map(
    successfulSales.map((item) => [item.productId, item._count._all]),
  );

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

    return {
      ...product,
      price: effectivePrice,
      soldCount: soldCountByProductId.get(product.id) ?? 0,
    };
  });

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <section className="pt-4 sm:pt-6">
        <div className="relative left-1/2 w-screen -translate-x-1/2 aspect-[1.8/1] overflow-hidden bg-[#06122e] sm:aspect-[5.63/1]">
          <img
            src="/images/banners/7A_Store_banner_text_kecil_2048x364%20(1).png"
            alt="7 April Store — top up Diamond Free Fire"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="relative left-1/2 w-screen -translate-x-1/2 border-b border-cyan-400/30 bg-[repeating-linear-gradient(135deg,#0b1222_0px,#0b1222_22px,#111a2c_22px,#111a2c_44px)]">
          <div className="mx-auto min-h-[150px] max-w-6xl px-4 sm:min-h-[138px] sm:px-6">
            <div className="relative flex min-h-[150px] items-center sm:min-h-[138px]">
              <img
                src="/images/games/freefire.jpg"
                alt="Free Fire"
                className="absolute -top-7 left-0 z-10 h-[112px] w-[112px] rounded-xl border border-cyan-400/30 object-cover shadow-xl sm:-top-[92px] sm:h-[200px] sm:w-[176px] sm:rounded-2xl"
              />
              <div className="min-w-0 pl-[124px] sm:pl-[212px]">
                <p className="text-base font-black tracking-wide text-white sm:text-xl">FREE FIRE</p>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">Garena</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-200 sm:text-xs">
                  <span><span className="mr-1.5 text-amber-400">⚡</span>Proses Cepat</span>
                  <span><span className="mr-1.5 text-indigo-400">●</span>Layanan Chat 24/7</span>
                  <span><span className="mr-1.5 text-blue-400">●</span>Pembayaran Aman!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-3 pb-14 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#081120] px-3 py-3 text-center text-xs font-semibold text-slate-300">
            <span className="text-blue-400">◇</span> Jaminan layanan
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#081120] px-3 py-3 text-center text-xs font-semibold text-slate-300">
            <span className="text-emerald-400">▣</span> Pembayaran aman & terpercaya
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#081120] px-3 py-3 text-center text-xs font-semibold text-slate-300">
            <span className="text-amber-400">ϟ</span> Proses cepat & otomatis
          </div>
        </div>

        <FreeFireLiveActivity />

        <div className="mt-5 grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-7">
          <div className="min-w-0">
            <TopUpClient products={displayProducts} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-white/10 bg-[#081120] p-5">
              <p className="text-sm font-bold text-slate-300">Rating & ulasan</p>
              <h2 className="mt-2 text-xl font-black text-white">Pengalaman pembeli</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Lihat ulasan pelanggan yang sudah menyelesaikan transaksi Free Fire di 7 April Store.
              </p>
              <a href="#ulasan-pelanggan" className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20">
                Lihat ulasan pelanggan
              </a>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#081120] p-5">
              <p className="text-sm font-bold text-white">Butuh bantuan?</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Jika pembayaran berhasil tetapi diamond belum masuk, hubungi admin dan sertakan nomor invoice.
              </p>
              <a href="https://wa.me/62895704041437" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500">
                Hubungi admin WhatsApp ↗
              </a>
            </section>

            <section className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.08] to-blue-500/[0.04] p-5">
              <p className="text-sm font-bold text-white">Cara top up</p>
              <ol className="mt-3 space-y-3 text-sm leading-5 text-slate-400">
                <li><span className="mr-2 font-black text-cyan-300">1.</span>Masukkan UID dan nomor WhatsApp.</li>
                <li><span className="mr-2 font-black text-cyan-300">2.</span>Pilih nominal Diamond.</li>
                <li><span className="mr-2 font-black text-cyan-300">3.</span>Bayar melalui QRIS.</li>
                <li><span className="mr-2 font-black text-cyan-300">4.</span>Pantau status pesanan.</li>
              </ol>
            </section>
          </aside>
        </div>

        <OrderStatusCheck />
        <RecentOrders />
        <section id="ulasan-pelanggan" className="scroll-mt-24">
          <FreeFireReviews showForm={false} />
        </section>
        <div className="mt-8">
          <WhatsAppPromoBanner />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
