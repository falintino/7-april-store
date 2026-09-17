import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, Gamepad2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Profil, identitas usaha, dan layanan resmi 7 April Store.",
};

export default function TentangKamiPage() {
  return (
    <main className="min-h-screen bg-[#030814] px-4 py-10 text-slate-200 sm:px-6">
      <article className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          <ArrowLeft size={17} />
          Kembali ke Beranda
        </Link>

        <div className="mt-7 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
            Tentang 7 April Store
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Layanan Top Up Game dari Kabupaten Sambas
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">
            7 April Store adalah usaha mikro milik Falintino yang menyediakan
            produk digital game secara langsung kepada pelanggan. Website ini
            digunakan untuk memilih produk, memasukkan UID tujuan, melakukan
            pembayaran, serta memantau status pesanan.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-[#07101f] p-6">
            <Gamepad2 className="text-blue-400" size={24} />
            <h2 className="mt-4 text-xl font-bold text-white">Layanan Kami</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Saat ini layanan utama kami adalah top up game, termasuk penjualan
              Diamond Free Fire. Produk diproses melalui penyedia produk digital
              setelah pembayaran berhasil dikonfirmasi.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#07101f] p-6">
            <ShieldCheck className="text-emerald-400" size={24} />
            <h2 className="mt-4 text-xl font-bold text-white">
              Transaksi Transparan
            </h2>
            <p className="mt-3 leading-7 text-slate-400">
              Harga dan total pembayaran ditampilkan sebelum pelanggan
              melanjutkan checkout. Pembayaran QRIS diproses melalui Midtrans,
              sedangkan status pesanan dapat diperiksa menggunakan nomor
              invoice.
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-[#07101f] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Identitas Usaha</h2>
          </div>
          <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Nama usaha</dt>
              <dd className="mt-1 font-semibold">7 April Store</dd>
            </div>
            <div>
              <dt className="text-slate-500">Nama pelaku usaha</dt>
              <dd className="mt-1 font-semibold">FALINTINO</dd>
            </div>
            <div>
              <dt className="text-slate-500">Nomor Induk Berusaha</dt>
              <dd className="mt-1 font-semibold">2704260003348</dd>
            </div>
            <div>
              <dt className="text-slate-500">Skala usaha</dt>
              <dd className="mt-1 font-semibold">Usaha Mikro</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Alamat usaha</dt>
              <dd className="mt-1 font-semibold leading-6">
                Dusun Harapan, Desa Semelagi Besar, Kecamatan Selakau, Kabupaten
                Sambas, Kalimantan Barat
              </dd>
            </div>
          </dl>
        </section>

        <nav className="mt-8 flex flex-wrap gap-5 border-t border-slate-800 pt-6 text-sm">
          <Link href="/contact" className="text-blue-400 hover:text-blue-300">
            Kontak Resmi
          </Link>
          <Link
            href="/syarat-ketentuan"
            className="text-blue-400 hover:text-blue-300"
          >
            Syarat dan Ketentuan
          </Link>
          <Link
            href="/kebijakan-pengiriman"
            className="text-blue-400 hover:text-blue-300"
          >
            Kebijakan Pengiriman
          </Link>
        </nav>
      </article>
    </main>
  );
}
