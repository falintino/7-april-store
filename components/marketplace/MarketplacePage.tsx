import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Handshake,
  KeyRound,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

type MarketplacePageProps = {
  type: "jual-akun" | "rekber" | "id-cantik" | "rental";
};

const config = {
  "jual-akun": {
    label: "Marketplace Akun",
    title: "Jual Akun Game",
    description:
      "Temukan akun game yang tersedia di 7 April Store dengan informasi produk yang ditampilkan secara jelas.",
    icon: ShoppingBag,
    accent: "Akun Game",
    bullets: ["Detail akun sebelum transaksi", "Status ketersediaan jelas", "Dukungan customer service"],
  },
  rekber: {
    label: "Layanan Transaksi",
    title: "Rekening Bersama",
    description:
      "Halaman informasi layanan Rekber 7 April Store untuk membantu transaksi akun game dengan alur yang lebih terstruktur.",
    icon: Handshake,
    accent: "Rekber",
    bullets: ["Alur transaksi terstruktur", "Konfirmasi sebelum proses", "Bantuan customer service"],
  },
  "id-cantik": {
    label: "Koleksi ID",
    title: "ID Cantik",
    description:
      "Koleksi ID game pilihan untuk kamu yang mencari nomor atau identitas akun yang lebih menarik.",
    icon: Sparkles,
    accent: "ID Cantik",
    bullets: ["Pilihan ID yang tersedia", "Informasi harga jelas", "Hubungi kami untuk ketersediaan"],
  },
  rental: {
    label: "Layanan Rental",
    title: "Rental Akun Game",
    description:
      "Layanan rental akun game untuk penggunaan sesuai periode yang tersedia di 7 April Store.",
    icon: KeyRound,
    accent: "Rental",
    bullets: ["Pilihan periode rental", "Informasi ketentuan jelas", "Dukungan customer service"],
  },
} as const;

export default function MarketplacePage({ type }: MarketplacePageProps) {
  const item = config[type];
  const Icon = item.icon;

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8 lg:pb-20 lg:pt-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
              <Icon size={15} />
              {item.label}
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              {item.title}
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                di 7 April Store
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              {item.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
              >
                Hubungi Customer Service
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06]"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {item.bullets.map((bullet) => (
            <div
              key={bullet}
              className="rounded-2xl border border-white/[0.07] bg-[#0b1120] p-5"
            >
              <BadgeCheck className="text-blue-400" size={20} />
              <h2 className="mt-4 text-sm font-black text-white">{bullet}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Informasi layanan ditampilkan sebelum kamu melanjutkan transaksi.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-blue-500/15 bg-gradient-to-br from-blue-600/10 via-[#0b1120] to-[#0b1120] p-7 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
            {item.accent}
          </p>
          <h2 className="mt-2 text-2xl font-black">
            Layanan sedang dikembangkan
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Struktur marketplace sudah disiapkan. Produk dan alur transaksi
            akan ditambahkan secara bertahap agar setiap layanan memiliki
            informasi dan proses yang jelas.
          </p>
        </div>
      </section>
    </main>
  );
}
