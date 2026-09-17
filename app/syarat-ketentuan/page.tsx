import Link from "next/link";

export const metadata = {
  title: "Syarat dan Ketentuan",
  description: "Syarat dan ketentuan penggunaan layanan 7 April Store.",
};

export default function SyaratKetentuanPage() {
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
          Syarat dan Ketentuan
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Terakhir diperbarui: 17 September 2026
        </p>

        <div className="mt-8 space-y-8 leading-7 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white">
              1. Tentang layanan
            </h2>
            <p className="mt-2">
              7 April Store menyediakan layanan top up game dan menjual produk
              digital secara langsung kepada pelanggan, termasuk Diamond Free
              Fire. Produk diproses melalui penyedia produk digital setelah
              pembayaran pelanggan berhasil dikonfirmasi.
            </p>
            <p className="mt-3">
              7 April Store bukan marketplace, penyelenggara pembayaran, atau
              perantara pembayaran untuk merchant lain. Kami tidak menerima
              maupun menyalurkan pembayaran atas nama penjual atau pihak ketiga
              lainnya.
            </p>
            <p className="mt-3">
              Layanan ini dioperasikan oleh FALINTINO sebagai pelaku Usaha Mikro
              dengan NIB 2704260003348, beralamat di Dusun Harapan, Desa
              Semelagi Besar, Kecamatan Selakau, Kabupaten Sambas, Kalimantan
              Barat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              2. Data pelanggan
            </h2>
            <p className="mt-2">
              Pelanggan wajib memasukkan UID atau data tujuan yang benar
              sebelum membuat pesanan. Pastikan kembali data tersebut sebelum
              melakukan pembayaran. Kesalahan data tujuan dari pelanggan dapat
              membuat produk terkirim ke akun yang berbeda dan tidak selalu
              dapat dibatalkan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              3. Pembayaran dan pemrosesan
            </h2>
            <p className="mt-2">
              Pesanan diproses setelah pembayaran terkonfirmasi. Saat ini,
              checkout menggunakan QRIS yang diproses melalui Midtrans. Total
              yang harus dibayar ditampilkan pada ringkasan pesanan sebelum
              pelanggan melanjutkan pembayaran. Waktu pemrosesan dapat berbeda
              bergantung pada status sistem pembayaran dan ketersediaan produk
              dari penyedia. Pelanggan dapat melihat status pesanan pada
              halaman yang disediakan setelah pembayaran dilakukan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              4. Harga dan ketersediaan
            </h2>
            <p className="mt-2">
              Harga, nominal, dan ketersediaan produk dapat berubah mengikuti
              pembaruan dari penyedia. Harga yang berlaku untuk pesanan adalah
              harga yang tampil saat pesanan dibuat dan pembayaran dilakukan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              5. Penggunaan yang dilarang
            </h2>
            <p className="mt-2">
              Layanan tidak boleh digunakan untuk aktivitas melanggar hukum,
              penipuan, penyalahgunaan metode pembayaran, atau tindakan yang
              merugikan pihak lain. Kami dapat menolak atau meninjau pesanan
              yang terindikasi tidak wajar demi keamanan transaksi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              6. Merek dan hubungan dengan penerbit game
            </h2>
            <p className="mt-2">
              Nama, logo, dan merek game yang disebutkan di website merupakan
              milik masing-masing pemegang hak. 7 April Store adalah layanan
              independen dan tidak mengklaim sebagai bagian dari atau afiliasi
              resmi penerbit game, kecuali dinyatakan berdasarkan izin
              tertulis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Bantuan</h2>
            <p className="mt-2">
              Untuk pertanyaan mengenai pesanan, gunakan kanal kontak yang
              tersedia di website dan sertakan nomor pesanan agar pengecekan
              dapat dilakukan dengan tepat.
            </p>
          </section>
        </div>

        <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-800 pt-6 text-sm">
          <Link
            href="/kebijakan-privasi"
            className="text-blue-400 hover:text-blue-300"
          >
            Kebijakan Privasi
          </Link>

          <Link
            href="/kebijakan-refund"
            className="text-blue-400 hover:text-blue-300"
          >
            Kebijakan Refund
          </Link>
        </nav>
      </article>
    </main>
  );
}
