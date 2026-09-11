import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  ExternalLink,
  Mail,
  Newspaper,
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

const ownerPress = [
  {
    outlet: "Liputan6",
    title: "Bangganya Falintino Raih Silver Play Button dari YouTube",
    href: "https://www.liputan6.com/showbiz/read/7893513/bangganya-falintino-raih-silver-play-button-dari-youtube-tepis-stigma-main-game-tak-bermanfaat",
  },
  {
    outlet: "RRI",
    title: "Kreator Asal Kalimantan Barat Nilai Ekonomi Digital Peluang Baru",
    href: "https://rri.co.id/jakarta/ekonomi/umkm/2508921/kreator-asal-kalimantan-barat-nilai-ekonomi-digital-peluang-baru-bagi-anak-muda",
  },
  {
    outlet: "Metro TV",
    title: "Teknologi Digital Jadi Solusi Anak Muda Daerah Tanpa Merantau",
    href: "https://www.metrotvnews.com/read/bVDCP1BJ-teknologi-digital-jadi-solusi-anak-muda-daerah-tanpa-merantau",
  },
  {
    outlet: "VIVA",
    title: "Gagal Jadi Polisi, Kini Raup Cuan dari Dunia Digital",
    href: "https://techno.viva.co.id/platform/30678-gagal-jadi-polisi-pemuda-kalbar-ini-kini-raup-cuan-dari-dunia-digital",
  },
];

export default function Home() {
  return (
    <main className="bg-[#030712]">
      <PromoBannerCarousel />
      <Hero />
      <QuickMenu />
      <ServicesGrid />
      <GamesGrid />

      <section className="border-t border-slate-800 bg-[#050b18] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
              <Newspaper size={16} />
              Tentang Pemilik & Publikasi
            </div>
            <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
              Perjalanan Falintino di Media
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              7 April Store dikelola oleh Falintino, kreator konten digital asal
              Kabupaten Sambas. Publikasi berikut membahas perjalanan Falintino
              sebagai kreator dan pelaku ekonomi digital.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {ownerPress.map((article) => (
              <a
                key={article.href}
                href={article.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-blue-500/40 hover:bg-blue-500/5"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">
                    {article.outlet}
                  </p>
                  <h3 className="mt-3 font-bold leading-6 text-white">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-xs text-slate-500">
                    Publikasi tentang pemilik 7 April Store
                  </p>
                </div>
                <ExternalLink
                  size={19}
                  className="mt-1 shrink-0 text-slate-500 transition group-hover:text-blue-400"
                />
              </a>
            ))}
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-600">
            Pencantuman artikel tidak berarti terdapat kerja sama atau dukungan
            komersial antara media tersebut dan 7 April Store.
          </p>
        </div>
      </section>

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

                <Link
                  href="/contact"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Hubungi Customer Service
                </Link>

                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=akun7april@gmail.com&su=Bantuan%207%20April%20Store"
                  target="_blank"
                  rel="noreferrer"
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

                <Link
                  href="/contact"
                  className="text-slate-400 transition hover:text-blue-400"
                >
                  Kontak & Identitas Usaha
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
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=akun7april@gmail.com&su=Bantuan%207%20April%20Store"
                  target="_blank"
                  rel="noreferrer"
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