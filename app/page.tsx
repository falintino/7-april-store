import Link from "next/link";

import Hero from "@/components/hero/Hero";
import QuickMenu from "@/components/quick-menu/QuickMenu";
import ServicesGrid from "@/components/services/ServicesGrid";
import GamesGrid from "@/components/games/GamesGrid";

export default function Home() {
  return (
    <main className="bg-[#030712]">
      <Hero />
      <QuickMenu />
      <ServicesGrid />
      <GamesGrid />

      <footer className="mt-12 border-t border-slate-800 bg-[#050b18]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">7 April Store</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Layanan pembelian produk digital untuk kebutuhan top up game.
                Pastikan UID dan nominal sudah benar sebelum melakukan pembayaran.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Informasi</h3>

              <div className="mt-3 flex flex-col gap-2 text-sm">
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
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} 7 April Store. Semua hak dilindungi.
          </div>
        </div>
      </footer>
    </main>
  );
}