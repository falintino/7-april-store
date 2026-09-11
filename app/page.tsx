import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  Mail,
  MessageCircle,
  Play,
  ShieldCheck,
} from "lucide-react";

import PromoBannerCarousel from "@/components/ads/PromoBannerCarousel";
import Hero from "@/components/hero/Hero";
import QuickMenu from "@/components/quick-menu/QuickMenu";
import ServicesGrid from "@/components/services/ServicesGrid";
import GamesGrid from "@/components/games/GamesGrid";

const whatsappUrl = "https://wa.me/6285960237306";

export default function Home() {
  return (
    <main className="bg-[#030712]">
      <PromoBannerCarousel />
      <Hero />
      <QuickMenu />
      <ServicesGrid />
      <GamesGrid />

      <footer className="mt-12 border-t border-slate-800 bg-[#050b18]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-black text-white shadow-[0_0_25px_rgba(37,99,235,0.35)]">
                  7A
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">
                    7 April Store
                  </h2>
                  <p className="text-xs text-slate-500">Gaming Marketplace</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                Layanan pembelian produk digital untuk kebutuhan game. Pilih
                produk, masukkan data akun dengan benar, lalu selesaikan
                pembayaran dengan aman.
              </p>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <p className="text-xs leading-5 text-slate-400">
                  Pastikan UID dan nominal sudah benar sebelum melakukan
                  pembayaran produk digital.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Produk & Layanan
              </h3>

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link
                  href="/topup"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Top Up Game
                </Link>

                <Link
                  href="/topup/free-fire"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Top Up Free Fire
                </Link>

                <Link
                  href="/akun"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Jual Akun
                </Link>

                <Link
                  href="/rekber"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Rekber
                </Link>

                <Link
                  href="/rental"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Rental
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Bantuan Pelanggan
              </h3>

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link
                  href="/topup"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Cara Melakukan Top Up
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Hubungi Customer Service
                </a>

                <a
                  href="mailto:akun7april@gmail.com"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Email Bantuan
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Chat WhatsApp
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Informasi</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link
                  href="/syarat-ketentuan"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Syarat dan Ketentuan
                </Link>

                <Link
                  href="/kebijakan-privasi"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Kebijakan Privasi
                </Link>

                <Link
                  href="/kebijakan-refund"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Kebijakan Refund
                </Link>

                <p className="pt-1 text-xs leading-5 text-slate-600">
                  Produk digital yang telah berhasil diproses tidak dapat
                  dibatalkan.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Ikuti 7 April Store
              </h3>

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <a
                  href="https://www.instagram.com/falintino07"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-400 transition hover:text-pink-400"
                >
                  <Camera size={17} />
                  Instagram
                </a>

                <a
                  href="https://www.tiktok.com/@aprilfullskin"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-400 transition hover:text-white"
                >
                  <Play size={17} />
                  TikTok
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-400 transition hover:text-emerald-400"
                >
                  <MessageCircle size={17} />
                  WhatsApp
                </a>

                <a
                  href="mailto:akun7april@gmail.com"
                  className="flex items-center gap-2 text-slate-400 transition hover:text-blue-400"
                >
                  <Mail size={17} />
                  Email Support
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p>
                © {new Date().getFullYear()} 7 April Store. Semua hak dilindungi.
              </p>
              <p className="mt-1 text-slate-600">
                Dikelola oleh Falintino · NIB 2704260003348
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <span>Produk Digital</span>
              <span>•</span>
              <span>Gaming Marketplace Indonesia</span>
              <span>•</span>
              <span>Transaksi melalui website 7 April Store</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}