import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pertanyaan Umum (FAQ) | 7 April Store",
  description:
    "Jawaban atas pertanyaan tentang top up Free Fire, pembayaran, status pesanan, dan refund di 7 April Store.",
};

const questions = [
  {
    question: "Bagaimana cara membeli Diamond Free Fire?",
    answer:
      "Buka halaman Top Up Free Fire, masukkan UID Free Fire dan nomor WhatsApp yang bisa dihubungi, pilih nominal yang tersedia, lalu periksa kembali rincian pesanan sebelum melanjutkan pembayaran.",
  },
  {
    question: "Apakah saya harus login untuk melakukan top up?",
    answer:
      "Pembelian top up Free Fire dapat dilakukan melalui formulir pemesanan tanpa login. Simpan nomor pesanan yang muncul agar statusnya mudah diperiksa.",
  },
  {
    question: "Metode pembayaran apa yang tersedia?",
    answer:
      "Pilih metode pembayaran yang sedang aktif dan ditampilkan pada halaman pemesanan. Ketersediaan metode dapat berubah. Ikuti instruksi pembayaran yang muncul setelah pesanan dibuat.",
  },
  {
    question: "Kapan Diamond dikirim?",
    answer:
      "Pesanan mulai diproses setelah pembayaran berhasil dikonfirmasi. Waktu pengiriman bergantung pada status sistem dan ketersediaan produk dari penyedia. Status pembayaran berhasil belum berarti top up sudah terkirim; periksa juga status top up pada halaman pesanan.",
  },
  {
    question: "Bagaimana cara mengecek status pesanan?",
    answer:
      "Simpan nomor pesanan atau invoice setelah checkout. Buka halaman detail pesanan yang diberikan setelah pembayaran atau gunakan fitur cek status pesanan di halaman Top Up Free Fire untuk melihat perkembangan pembayaran dan top up.",
  },
  {
    question: "Bagaimana jika pembayaran berhasil tetapi top up masih pending?",
    answer:
      "Status pending berarti pesanan masih menunggu hasil pemrosesan dari penyedia produk. Jangan membayar ulang pesanan yang sama. Periksa kembali statusnya dan hubungi layanan pelanggan jika membutuhkan bantuan dengan menyertakan nomor pesanan serta bukti pembayaran.",
  },
  {
    question: "Apa yang terjadi jika UID yang saya masukkan salah?",
    answer:
      "Periksa UID sebelum mengonfirmasi pesanan. Kesalahan data tujuan dari pelanggan dapat menyebabkan produk terkirim ke akun yang berbeda dan transaksi yang sudah diproses tidak selalu dapat dibatalkan atau direfund.",
  },
  {
    question: "Apakah pesanan bisa dibatalkan atau dikembalikan dananya?",
    answer:
      "Pesanan digital yang berhasil diproses atau terkirim tidak dapat dibatalkan maupun direfund. Jika pembayaran berhasil tetapi pesanan gagal diproses dan produk tidak terkirim, atau terjadi pembayaran ganda, hubungi kami untuk peninjauan sesuai Kebijakan Refund.",
  },
  {
    question: "Bagaimana cara menghubungi 7 April Store?",
    answer:
      "Hubungi kami melalui WhatsApp atau email yang tercantum pada halaman Kontak. Sertakan nomor pesanan, waktu transaksi, dan bukti pembayaran bila berkaitan dengan transaksi. Jangan pernah membagikan password, PIN, atau OTP.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#030814] px-4 py-10 text-slate-200 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-10">
        <Link href="/" className="text-sm font-medium text-blue-400 transition hover:text-blue-300">
          ← Kembali ke Beranda
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Pertanyaan Umum (FAQ)
        </h1>
        <p className="mt-3 leading-7 text-slate-400">
          Informasi seputar pembelian produk digital, pembayaran, dan bantuan pesanan di 7 April Store.
        </p>

        <div className="mt-8 space-y-4">
          {questions.map(({ question, answer }) => (
            <section key={question} className="rounded-xl border border-slate-800 bg-[#07101f] p-5">
              <h2 className="text-lg font-semibold text-white">{question}</h2>
              <p className="mt-2 leading-7 text-slate-300">{answer}</p>
            </section>
          ))}
        </div>

        <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-800 pt-6 text-sm">
          <Link href="/topup/free-fire" className="text-blue-400 hover:text-blue-300">Top Up Free Fire</Link>
          <Link href="/contact" className="text-blue-400 hover:text-blue-300">Hubungi Kami</Link>
          <Link href="/syarat-ketentuan" className="text-blue-400 hover:text-blue-300">Syarat dan Ketentuan</Link>
          <Link href="/kebijakan-refund" className="text-blue-400 hover:text-blue-300">Kebijakan Refund</Link>
        </nav>
      </article>
    </main>
  );
}
