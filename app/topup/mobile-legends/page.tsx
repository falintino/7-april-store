import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GameTopUpClient from "../GameTopUpClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Top Up Mobile Legends | 7 April Store",
  description: "Top up Diamond Mobile Legends melalui 7 April Store. Pilih produk yang tersedia, masukkan User ID dan Zone ID, lalu bayar QRIS.",
  alternates: { canonical: "https://store.falintino.com/topup/mobile-legends" },
};

export default async function MobileLegendsPage() {
  const products = await prisma.product.findMany({
    where: { game: "Mobile Legends", active: true },
    orderBy: [{ popular: "desc" }, { price: "asc" }],
    select: { id: true, name: true, sku: true, price: true, popular: true },
  });
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/topup" className="text-sm font-semibold text-blue-300 hover:text-blue-200">← Semua game</Link>
        <header className="my-8 overflow-hidden rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-950 via-slate-950 to-blue-950 p-7 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">7 April Store · Game Top Up</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Mobile Legends: Bang Bang</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Pilih produk Diamond yang tersedia, masukkan User ID dan Zone ID, lalu lanjutkan pembayaran QRIS.</p>
        </header>
        {products.length ? <GameTopUpClient game="Mobile Legends" products={products} /> : (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
            <h2 className="text-lg font-black text-amber-100">Katalog Mobile Legends belum diaktifkan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Produk tidak akan ditampilkan sampai SKU aktif di Buyer Digiflazz diimpor dan diperiksa di panel admin. Ini mencegah harga atau kode produk yang belum terverifikasi dipakai untuk transaksi.</p>
            <Link href="/topup" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold">Kembali ke daftar game</Link>
          </div>
        )}
      </div>
    </main>
  );
}
