import Link from "next/link";

export default function OrderNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10 text-3xl">
            🔎
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Pesanan Tidak Ditemukan
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Invoice tidak ditemukan
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            Pastikan nomor invoice yang kamu
            masukkan sudah benar dan tidak ada
            karakter yang tertinggal.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href="/topup/free-fire#cek-pesanan"
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500"
            >
              Cek Invoice Lagi
            </Link>

            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}