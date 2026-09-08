import Link from "next/link";

export default function AkunPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            Marketplace Akun
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Jual Beli Akun Game
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Fitur marketplace akun sedang dalam tahap pengembangan.
            Nantinya kamu bisa melihat akun game yang tersedia,
            harga, detail akun, dan status penjualan langsung di
            7 April Store.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-2xl">
              🎮
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Akun Free Fire
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Marketplace akun Free Fire akan tersedia di sini.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-2xl">
              🔒
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Transaksi Aman
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sistem transaksi dan rekber akan terhubung dengan
              database 7 April Store.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-2xl">
              ⚡
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Segera Hadir
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Fitur ini akan kita aktifkan setelah sistem top up
              dan pembayaran selesai.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h2 className="text-xl font-bold">
            Mau Top Up Game?
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Fitur Top Up Free Fire sudah tersedia dan sedang
            dalam tahap integrasi pembayaran otomatis.
          </p>

          <Link
            href="/topup/free-fire"
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Top Up Free Fire
          </Link>
        </div>
      </div>
    </main>
  );
}