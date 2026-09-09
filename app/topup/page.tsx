import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  ChevronRight,
  Gamepad2,
  Mail,
  MessageCircle,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import PromoBannerCarousel from "@/components/ads/PromoBannerCarousel";

const whatsappUrl = "https://wa.me/6285960237306";

const products = [
  {
    name: "Free Fire",
    description:
      "Top up Diamond Free Fire cepat, aman, dan langsung diproses setelah pembayaran.",
    href: "/topup/free-fire",
    image: "/images/games/freefire.jpg",
    tag: "TERPOPULER",
    price: "Mulai Rp1.000",
  },
];

export default function TopUpPage() {
  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-220px] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute -right-40 top-[420px] h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <PromoBannerCarousel />

      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 lg:px-8 lg:pb-14 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300">
              <Sparkles size={14} />
              Top Up Game Cepat & Aman
            </div>

            <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Top Up Game
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                Tanpa Ribet.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Pilih game favoritmu, masukkan ID, pilih nominal dan selesaikan
              pembayaran. Pesanan diproses melalui sistem 7 April Store.
            </p>

            <div className="mx-auto mt-8 flex max-w-xl items-center rounded-2xl border border-white/[0.08] bg-white/[0.045] p-2 shadow-2xl backdrop-blur-xl">
              <Search className="ml-3 text-slate-500" size={19} />

              <input
                type="text"
                placeholder="Cari game..."
                className="h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600"
              />

              <button className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold transition hover:bg-blue-500">
                Cari
              </button>
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
              <Zap size={18} className="text-yellow-400" />

              <div>
                <p className="text-xs font-bold">Proses Cepat</p>
                <p className="text-[10px] text-slate-500">Sistem otomatis</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
              <ShieldCheck size={18} className="text-emerald-400" />

              <div>
                <p className="text-xs font-bold">Pembayaran Aman</p>
                <p className="text-[10px] text-slate-500">
                  Payment terpercaya
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
              <BadgeCheck size={18} className="text-blue-400" />

              <div>
                <p className="text-xs font-bold">7 April Store</p>
                <p className="text-[10px] text-slate-500">
                  Gaming marketplace
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-blue-400">
                <Gamepad2 size={18} />

                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Daftar Game
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Pilih Game Favoritmu
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Game lainnya akan segera tersedia.
              </p>
            </div>

            <span className="hidden text-xs text-slate-600 sm:block">
              1 Game tersedia
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="group relative overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#0b1120] p-3 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_20px_70px_rgba(37,99,235,0.12)]"
              >
                <div className="relative h-44 overflow-hidden rounded-[20px]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

                  <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[9px] font-black tracking-wider backdrop-blur-md">
                    {product.tag}
                  </div>
                </div>

                <div className="relative p-3 pb-2 pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black">{product.name}</h3>

                      <p className="mt-1 text-xs font-semibold text-blue-400">
                        {product.price}
                      </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 transition group-hover:border-blue-500/30 group-hover:bg-blue-500/10 group-hover:text-blue-400">
                      <ChevronRight size={18} />
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">
                    {product.description}
                  </p>

                  <div className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black transition group-hover:bg-blue-500">
                    Top Up Sekarang
                    <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            ))}

            <div className="relative flex min-h-[350px] items-center justify-center overflow-hidden rounded-[26px] border border-dashed border-white/[0.08] bg-white/[0.015] p-6">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035]">
                  <Gamepad2 size={23} className="text-slate-600" />
                </div>

                <p className="mt-4 text-sm font-bold text-slate-400">
                  Game Lainnya
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Segera hadir di 7 April Store
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
          <div className="relative overflow-hidden rounded-[28px] border border-blue-500/20 bg-gradient-to-br from-blue-600/15 via-[#0b1120] to-[#0b1120] px-6 py-9 sm:px-10">
            <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-blue-500/10 blur-[80px]" />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                  7 April Store
                </p>

                <h3 className="mt-2 text-xl font-black sm:text-2xl">
                  Top up lebih gampang.
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Pilih produk, masukkan data akun, lakukan pembayaran dan
                  pantau status pesanan langsung dari website.
                </p>
              </div>

              <Link
                href="/topup/free-fire"
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200"
              >
                Mulai Top Up
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-[#050b18]">
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
            <p>
              © {new Date().getFullYear()} 7 April Store. Semua hak dilindungi.
            </p>

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