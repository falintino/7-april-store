import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi | 7 April Store",
  description: "Kebijakan privasi 7 April Store.",
};

export default function KebijakanPrivasiPage() {
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
          Kebijakan Privasi
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Terakhir diperbarui: 9 September 2026
        </p>

        <div className="mt-8 space-y-8 leading-7 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white">
              1. Data yang kami gunakan
            </h2>
            <p className="mt-2">
              Saat pelanggan membuat pesanan, kami dapat memproses data seperti
              UID atau data tujuan, nomor WhatsApp, produk yang dipilih, nomor
              pesanan, serta status pembayaran. Data tersebut digunakan untuk
              menjalankan dan membantu pesanan pelanggan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              2. Tujuan penggunaan data
            </h2>
            <p className="mt-2">
              Data digunakan untuk memverifikasi pembayaran, memproses produk
              digital, menampilkan status pesanan, mencegah penyalahgunaan,
              dan memberikan bantuan apabila pelanggan menghubungi kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              3. Mitra layanan
            </h2>
            <p className="mt-2">
              Untuk menyelesaikan transaksi, data yang diperlukan dapat
              diteruskan secara terbatas kepada penyedia pembayaran dan
              penyedia produk digital. Data hanya dikirim sejauh diperlukan
              untuk menjalankan transaksi yang diminta pelanggan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. Keamanan</h2>
            <p className="mt-2">
              Kami berupaya menjaga data transaksi dengan pembatasan akses dan
              penggunaan koneksi aman. Pelanggan juga perlu menjaga
              kerahasiaan perangkat, akun, dan bukti pembayaran miliknya
              sendiri.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              5. Penyimpanan data
            </h2>
            <p className="mt-2">
              Data transaksi disimpan selama diperlukan untuk pemrosesan
              pesanan, pencatatan, penyelesaian kendala, dan kewajiban yang
              berlaku. Kami tidak menjual data pribadi pelanggan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              6. Pertanyaan privasi
            </h2>
            <p className="mt-2">
              Jika memiliki pertanyaan terkait data pesanan, hubungi kami
              melalui kanal kontak yang tersedia di website dan sertakan nomor
              pesanan bila ada.
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
        </nav>
      </article>
    </main>
  );
}