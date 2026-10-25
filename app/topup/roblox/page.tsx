import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GameTopUpClient from "../GameTopUpClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Top Up Roblox | 7 April Store",
  description: "Lihat produk Roblox yang sudah diverifikasi dan tersedia di 7 April Store.",
  alternates: { canonical: "https://store.falintino.com/topup/roblox" },
};

export default async function RobloxPage() {
  const products = await prisma.product.findMany({
    where: { game: "Roblox", active: true },
    orderBy: [{ popular: "desc" }, { price: "asc" }],
    select: { id: true, name: true, sku: true, price: true, popular: true },
  });
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/topup" className="text-sm font-semibold text-blue-300 hover:text-blue-200">← Semua game</Link>
        <header className="my-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-950 to-black p-7 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">7 April Store · Game Top Up</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Roblox</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Produk Roblox hanya ditampilkan setelah SKU dan metode penyerahannya diverifikasi. Voucher/kode redeem tidak boleh diperlakukan sebagai top-up langsung.</p>
        </header>
        {products.length ? <GameTopUpClient game="Roblox" products={products} /> : (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
            <h2 className="text-lg font-black text-amber-100">Katalog Roblox belum diaktifkan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Periksa apakah produk di Buyer Digiflazz merupakan top-up langsung atau voucher. Produk baru harus diimpor dan diaktifkan setelah metode pengirimannya dipastikan cocok.</p>
            <Link href="/admin/game-catalog" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold">Buka Pengaturan Katalog</Link>
          </div>
        )}
      </div>
    </main>
  );
}
