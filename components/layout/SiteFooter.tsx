import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

const whatsappUrl = "https://wa.me/62895704041437";
const instagramUrl = "https://www.instagram.com/falintino07";
const tiktokUrl = "https://www.tiktok.com/@aprilfullskin";
const supportEmail = "falintino10@gmail.com";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#06101f]">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-600/30">
                7A
              </div>

              <div>
                <p className="font-bold text-white">7 April Store</p>
                <p className="text-xs text-slate-400">Layanan Top Up Game</p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Layanan pembelian produk digital untuk kebutuhan top up game.
              Pilih produk dan nominal, masukkan data akun game, lalu selesaikan
              pembayaran melalui metode yang tersedia.
            </p>

            <div className="mt-6 flex max-w-sm gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />

              <p className="text-xs leading-5 text-slate-300">
                Pastikan UID, server, nominal, dan metode pembayaran sudah benar
                sebelum mengonfirmasi pesanan top up.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Layanan Top Up</h2>

            <nav className="mt-5 grid gap-3 text-sm text-slate-400">
              <Link href="/topup" className="transition hover:text-blue-400">
                Semua Produk
              </Link>

              <Link
                href="/topup/free-fire"
                className="transition hover:text-blue-400"
              >
                Top Up Free Fire
              </Link>

              <Link href="/" className="transition hover:text-blue-400">
                Beranda
              </Link>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Bantuan Pelanggan</h2>

            <nav className="mt-5 grid gap-3 text-sm text-slate-400">
              <Link href="/profil" className="transition hover:text-blue-400">
                Akun Saya
              </Link>

              <Link href="/login" className="transition hover:text-blue-400">
                Login Pelanggan
              </Link>

              <Link href="/contact" className="transition hover:text-blue-400">
                Hubungi Kami
              </Link>

              <a
                href={`mailto:${supportEmail}`}
                className="transition hover:text-blue-400"
              >
                Email Bantuan
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-blue-400"
              >
                Chat WhatsApp
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Informasi</h2>

            <nav className="mt-5 grid gap-3 text-sm text-slate-400">
              <Link
                href="/tentang-kami"
                className="transition hover:text-blue-400"
              >
                Tentang Kami
              </Link>

              <Link
                href="/syarat-ketentuan"
                className="transition hover:text-blue-400"
              >
                Syarat dan Ketentuan
              </Link>

              <Link
                href="/kebijakan-privasi"
                className="transition hover:text-blue-400"
              >
                Kebijakan Privasi
              </Link>

              <Link
                href="/kebijakan-refund"
                className="transition hover:text-blue-400"
              >
                Kebijakan Refund
              </Link>

              <Link
                href="/kebijakan-pengiriman"
                className="transition hover:text-blue-400"
              >
                Kebijakan Pengiriman
              </Link>
            </nav>

            <h2 className="mt-7 text-sm font-bold text-white">
              Ikuti 7 April Store
            </h2>

            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition hover:text-blue-400"
              >
                <Camera className="h-4 w-4" />
                Instagram
              </a>

              <a
                href={tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition hover:text-blue-400"
              >
                <MessageCircle className="h-4 w-4" />
                TikTok
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition hover:text-blue-400"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>

              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2 transition hover:text-blue-400"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <p>© 2026 7 April Store. Semua hak dilindungi.</p>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <span>Produk Digital</span>
            <span className="hidden text-slate-700 sm:inline">•</span>
            <span>Layanan Top Up Game</span>
            <span className="hidden text-slate-700 sm:inline">•</span>
            <span>Transaksi melalui website 7 April Store</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
