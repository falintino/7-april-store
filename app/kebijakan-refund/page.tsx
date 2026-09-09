import Link from "next/link";

export const metadata = {
  title: "Kebijakan Refund | 7 April Store",
  description: "Kebijakan refund 7 April Store.",
};

export default function KebijakanRefundPage() {
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
          Kebijakan Refund
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Terakhir diperbarui: 9 September 2026
        </p>

        <div className="mt-8 space-y-8 leading-7 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white">
              1. Ketentuan umum
            </h2>
            <p className="mt-2">
              Produk digital memiliki proses pengiriman yang cepat. Karena itu,
              pesanan yang sudah berhasil diproses atau terkirim ke akun tujuan
              tidak dapat dibatalkan maupun direfund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              2. Kondisi yang dapat ditinjau
            </h2>
            <p className="mt-2">
              Permohonan refund dapat ditinjau apabila pembayaran pelanggan
              berhasil, tetapi pesanan gagal diproses dan produk tidak terkirim.
              Kami juga akan meninjau laporan pembayaran ganda apabila
              pelanggan menyertakan bukti transaksi yang sesuai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              3. Kondisi yang tidak dapat direfund
            </h2>
            <p className="mt-2">
              Refund tidak dapat diberikan untuk kesalahan UID atau data tujuan
              yang dimasukkan pelanggan, produk yang sudah berhasil diterima,
              perubahan keputusan setelah pesanan diproses, atau kendala pada
              akun game yang tidak berasal dari proses transaksi kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              4. Cara mengajukan bantuan
            </h2>
            <p className="mt-2">
              Hubungi kami melalui kanal kontak pada website. Sertakan nomor
              pesanan, waktu transaksi, metode pembayaran, dan bukti pembayaran
              agar tim dapat melakukan pengecekan. Jangan mengirimkan kata
              sandi, PIN, atau kode rahasia kepada siapa pun.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              5. Hasil peninjauan
            </h2>
            <p className="mt-2">
              Setiap laporan ditinjau berdasarkan status pembayaran dan catatan
              transaksi. Bila refund disetujui, metode dan waktu pengembalian
              akan diinformasikan melalui kanal bantuan yang digunakan.
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
            href="/kebijakan-privasi"
            className="text-blue-400 hover:text-blue-300"
          >
            Kebijakan Privasi
          </Link>
        </nav>
      </article>
    </main>
  );
}