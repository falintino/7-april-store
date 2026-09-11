import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Gamepad2,
  Images,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { akunList } from "../../data/akun";

type DetailAkunProps = {
  params: Promise<{ slug: string }>;
};

export default async function DetailAkun({ params }: DetailAkunProps) {
  const { slug } = await params;
  const akun = akunList.find((item) => item.slug === slug);

  if (!akun) {
    notFound();
  }

  const pesan = encodeURIComponent(
    `Halo Kak, saya ingin membeli ${akun.nama} dengan harga ${akun.harga}. Apakah stoknya masih tersedia?`
  );
  const whatsappUrl = `https://wa.me/6285960237306?text=${pesan}`;
  const produkTerkait = akunList.filter((item) => item.id !== akun.id).slice(0, 4);

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="transition hover:text-white">Beranda</Link>
          <span>/</span>
          <Link href="/akun" className="transition hover:text-white">Akun Game</Link>
          <span>/</span>
          <span className="text-slate-300">{akun.nama}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.92fr)] lg:gap-12">
          <div>
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950 via-blue-700 to-cyan-500 p-8 shadow-2xl shadow-blue-950/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_38%)]" />
              <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

              <div className="relative text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/20 bg-white/15 shadow-2xl backdrop-blur-sm">
                  <Gamepad2 className="h-14 w-14 text-white" aria-hidden="true" />
                </div>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-blue-100">
                  7 April Store
                </p>
                <p className="mt-2 text-2xl font-black sm:text-3xl">{akun.nama}</p>
              </div>

              <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-bold shadow-lg">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                {akun.status}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-400">
              <Images className="h-5 w-5 shrink-0 text-blue-400" aria-hidden="true" />
              Foto gameplay dan koleksi akun dapat ditambahkan setelah foto asli produk diunggah.
            </div>
          </div>

          <div className="lg:pt-2">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white">Free Fire</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">Akun Game</span>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">Stok Terverifikasi</span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{akun.nama}</h1>
            <p className="mt-4 text-3xl font-black text-blue-400">{akun.harga}</p>

            <p className="mt-5 text-base leading-7 text-slate-400">
              Akun Free Fire level {akun.level} dengan {akun.bundle} bundle,
              {akun.evo} Evo Gun, dan {akun.emote} emote. Login menggunakan {akun.login}.
              Konfirmasi stok dan detail akun langsung kepada admin sebelum pembayaran.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-2xl font-black">{akun.bundle}</p>
                <p className="mt-1 text-xs text-slate-400">Bundle</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-2xl font-black">{akun.evo}</p>
                <p className="mt-1 text-xs text-slate-400">Evo Gun</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-2xl font-black">{akun.emote}</p>
                <p className="mt-1 text-xs text-slate-400">Emote</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-2xl font-black">{akun.level}</p>
                <p className="mt-1 text-xs text-slate-400">Level</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                Metode login: {akun.login}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <PackageCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                Status produk: {akun.status}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Sparkles className="h-5 w-5 text-blue-400" aria-hidden="true" />
                Detail koleksi dikonfirmasi kembali oleh admin
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#030712]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Chat Admin untuk Membeli
            </a>

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Jangan melakukan pembayaran sebelum stok dan detail akun dikonfirmasi oleh admin.
            </p>
          </div>
        </section>

        <section className="mt-14 border-t border-white/10 pt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Produk Terkait</h2>
            <Link href="/akun" className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 transition hover:text-blue-300">
              Lihat semua
              <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
            </Link>
          </div>

          {produkTerkait.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {produkTerkait.map((item) => (
                <Link
                  key={item.id}
                  href={`/akun/${item.slug}`}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 transition hover:-translate-y-1 hover:border-blue-500/50"
                >
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-blue-800 to-cyan-500">
                    <Gamepad2 className="h-10 w-10 text-white" aria-hidden="true" />
                  </div>
                  <div className="p-4">
                    <p className="font-bold">{item.nama}</p>
                    <p className="mt-2 font-black text-blue-400">{item.harga}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <p className="text-slate-400">
                Belum ada produk lain. Produk baru akan otomatis muncul di bagian ini setelah ditambahkan.
              </p>
            </div>
          )}
        </section>

        <Link
          href="/akun"
          className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar akun
        </Link>
      </div>
    </main>
  );
}
