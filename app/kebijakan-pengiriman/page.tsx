import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Pengiriman Produk Digital",
  description:
    "Ketentuan pemrosesan dan pengiriman produk digital 7 April Store.",
};

export default function KebijakanPengirimanPage() {
  return (
    <main className="min-h-screen bg-[#030814] px-4 py-10 text-slate-200 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-10">
        <Link
          href="/"
          className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          ← Kembali ke Beranda
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Kebijakan Pengiriman Produk Digital
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Terakhir diperbarui: 17 September 2026
        </p>

        <div className="mt-8 space-y-8 leading-7 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white">
              1. Bentuk pengiriman
            </h2>
            <p className="mt-2">
              Produk yang dijual adalah produk digital. Tidak ada barang fisik
              atau biaya kirim. Diamond atau produk akan dikirim langsung ke UID
              atau akun game yang dimasukkan pelanggan saat membuat pesanan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              2. Waktu pemrosesan
            </h2>
            <p className="mt-2">
              Pesanan mulai diproses otomatis setelah pembayaran dinyatakan
              berhasil. Dalam kondisi normal, produk diterima dalam beberapa
              menit. Gangguan provider, pemeliharaan sistem, atau antrean dapat
              menyebabkan proses memerlukan waktu hingga 1 × 24 jam.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Data tujuan</h2>
            <p className="mt-2">
              Pelanggan bertanggung jawab memastikan UID, server, dan nominal
              sudah benar. Produk yang telah terkirim ke data tujuan yang
              dimasukkan pelanggan tidak dapat dialihkan ke akun lain.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              4. Pemantauan pesanan
            </h2>
            <p className="mt-2">
              Status pembayaran dan pengiriman dapat diperiksa pada halaman
              pesanan menggunakan nomor invoice. Simpan nomor invoice sampai
              produk dinyatakan berhasil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              5. Pesanan tertunda atau gagal
            </h2>
            <p className="mt-2">
              Jika produk belum diterima setelah 1 × 24 jam meskipun pembayaran
              berhasil, hubungi layanan pelanggan dan sertakan nomor invoice.
              Pesanan gagal akan ditinjau untuk diproses ulang atau ditangani
              sesuai Kebijakan Refund.
            </p>
          </section>
        </div>

        <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-800 pt-6 text-sm">
          <Link
            href="/syarat-ketentuan"
            className="text-blue-400 hover:text-blue-300"
          >
            Syarat dan Ketentuan
          </Link>
          <Link
            href="/kebijakan-refund"
            className="text-blue-400 hover:text-blue-300"
          >
            Kebijakan Refund
          </Link>
          <Link href="/contact" className="text-blue-400 hover:text-blue-300">
            Hubungi Kami
          </Link>
        </nav>
      </article>
    </main>
  );
}
