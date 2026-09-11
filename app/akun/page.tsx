import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Gamepad2,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { akunList } from "../data/akun";

export default function AkunPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
              <Gamepad2 className="h-4 w-4" aria-hidden="true" />
              Marketplace Akun
            </span>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              Akun Game Tersedia
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
              Pilih akun yang tersedia, lihat detailnya, lalu hubungi admin untuk
              konfirmasi stok dan proses transaksi.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
            <PackageCheck className="h-5 w-5" aria-hidden="true" />
            {akunList.length} produk tersedia
          </div>
        </div>

        {akunList.length > 0 ? (
          <section
            aria-label="Daftar akun game"
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {akunList.map((akun) => (
              <article
                key={akun.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-blue-500/50"
              >
                <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_38%)]" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15 shadow-2xl backdrop-blur">
                    <Gamepad2 className="h-10 w-10 text-white" aria-hidden="true" />
                  </div>

                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    {akun.status}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-sm font-semibold text-blue-400">FREE FIRE</p>
                  <h2 className="mt-1 text-xl font-bold text-white">{akun.nama}</h2>
                  <p className="mt-3 text-2xl font-black text-white">{akun.harga}</p>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3">
                      <p className="text-lg font-bold text-white">{akun.bundle}</p>
                      <p className="mt-1 text-xs text-slate-400">Bundle</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3">
                      <p className="text-lg font-bold text-white">{akun.evo}</p>
                      <p className="mt-1 text-xs text-slate-400">Evo Gun</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3">
                      <p className="text-lg font-bold text-white">{akun.level}</p>
                      <p className="mt-1 text-xs text-slate-400">Level</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    Login {akun.login} • Konfirmasi melalui admin
                  </div>

                  <Link
                    href={`/akun/${akun.slug}`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    Lihat Detail
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-blue-400" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">Belum ada akun tersedia</h2>
            <p className="mt-2 text-slate-400">Produk baru akan ditampilkan di halaman ini.</p>
          </section>
        )}

        <section className="mt-10 flex flex-col gap-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Mau Top Up Free Fire?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Pilih nominal diamond dan lanjutkan pembayaran melalui halaman top up.
            </p>
          </div>

          <Link
            href="/topup/free-fire"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Top Up Sekarang
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
