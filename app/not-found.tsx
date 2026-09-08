import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-center">
      <div>
        <h1 className="text-7xl font-black text-blue-500">404</h1>

        <h2 className="mt-6 text-3xl font-bold text-white">
          Halaman tidak ditemukan
        </h2>

        <p className="mt-4 text-slate-400">
          Maaf, halaman yang kamu cari tidak tersedia.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}