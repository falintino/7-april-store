import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kontak dan Informasi Usaha",
  description:
    "Kontak resmi, identitas usaha, dan bantuan pelanggan 7 April Store.",
};

const whatsappUrl =
  "https://wa.me/6285960237306?text=Halo%207%20April%20Store%2C%20saya%20memerlukan%20bantuan.";

const contactItems = [
  {
    title: "WhatsApp Customer Service",
    value: "0859-6023-7306",
    description: "Untuk bantuan pesanan dan informasi layanan.",
    href: whatsappUrl,
    icon: MessageCircle,
  },
  {
    title: "Email Bantuan",
    value: "akun7april@gmail.com",
    description: "Sertakan nomor pesanan apabila berkaitan dengan transaksi.",
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=akun7april@gmail.com&su=Bantuan%207%20April%20Store",
    icon: Mail,
  },
  {
    title: "Jam Pelayanan",
    value: "Setiap hari, 09.00–22.00 WIB",
    description: "Pesan di luar jam pelayanan akan dibalas pada jam berikutnya.",
    icon: Clock3,
  },
  {
    title: "Lokasi Usaha",
    value: "Selakau, Kabupaten Sambas, Kalimantan Barat",
    description: "Layanan dilakukan secara online melalui website resmi.",
    icon: MapPin,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#030814] px-4 py-10 text-slate-200 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          <ArrowLeft size={17} />
          Kembali ke Beranda
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
          <div className="border-b border-slate-800 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900 p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
              Kanal Resmi
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Kontak 7 April Store
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-400">
              Hubungi kami melalui WhatsApp atau email resmi untuk bantuan
              pesanan, pembayaran, maupun informasi produk digital.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-10">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const cardContent = (
                <>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{item.title}</h2>
                    <p className="mt-1 font-medium text-blue-300">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </>
              );

              return item.href ? (
                <a
                  key={item.title}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="flex gap-4 rounded-2xl border border-slate-800 bg-[#07101f] p-5 transition hover:border-blue-500/40 hover:bg-blue-500/5"
                >
                  {cardContent}
                </a>
              ) : (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-slate-800 bg-[#07101f] p-5"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 size={22} />
            </div>
            <div className="w-full">
              <h2 className="text-xl font-bold text-white">Identitas Usaha</h2>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Nama usaha</dt>
                  <dd className="mt-1 font-medium">7 April Store</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Penanggung jawab</dt>
                  <dd className="mt-1 font-medium">Falintino</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Nomor Induk Berusaha</dt>
                  <dd className="mt-1 font-medium">2704260003348</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Jenis layanan</dt>
                  <dd className="mt-1 font-medium">
                    Produk digital dan layanan game
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-amber-300"
              size={20}
            />
            <p className="text-sm leading-6">
              Admin tidak pernah meminta kata sandi, PIN, OTP, atau kode
              pemulihan akun pelanggan.
            </p>
          </div>

          <nav className="mt-8 flex flex-wrap gap-5 border-t border-slate-800 pt-6 text-sm">
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
            <Link
              href="/kebijakan-refund"
              className="text-blue-400 hover:text-blue-300"
            >
              Kebijakan Refund
            </Link>
          </nav>
        </section>
      </div>
    </main>
  );
}
