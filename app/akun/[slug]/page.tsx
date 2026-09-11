import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Gamepad2, MessageCircle, PackageCheck, ShieldCheck } from "lucide-react";
import { formatAccountPrice, getPublicAccountProduct, getPublicAccountProducts } from "@/lib/account-products";

export const dynamic = "force-dynamic";

export default async function DetailAkun({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublicAccountProduct(slug);
  if (!product) notFound();

  const related = (await getPublicAccountProducts()).filter((item) => item.id !== product.id).slice(0, 4);
  const sellingPrice = product.discountPrice ?? product.price;
  const message = encodeURIComponent(`Halo Kak, saya ingin membeli ${product.title} seharga ${formatAccountPrice(sellingPrice)}. Apakah stoknya masih tersedia?`);

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link href="/">Beranda</Link><span>/</span><Link href="/akun">Akun Game</Link><span>/</span><span className="text-slate-300">{product.title}</span></nav>
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.92fr)] lg:gap-12">
          <div>
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950 via-blue-700 to-cyan-500 shadow-2xl">
              {product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={product.title} className="h-full w-full object-cover" /> : <Gamepad2 className="h-24 w-24 text-white" />}
              <span className={`absolute left-5 top-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold shadow-lg ${product.availability === "AVAILABLE" ? "bg-emerald-500" : product.availability === "RESERVED" ? "bg-amber-500" : "bg-slate-600"}`}><BadgeCheck className="h-4 w-4" />{product.availability === "AVAILABLE" ? "Tersedia" : product.availability === "RESERVED" ? "Dipesan" : "Terjual"}</span>
            </div>
            {product.imageUrls.length > 1 && <div className="mt-4 grid grid-cols-4 gap-3">{product.imageUrls.slice(1).map((url, index) => <div key={url} className="aspect-square overflow-hidden rounded-xl border border-white/10"><img src={url} alt={`${product.title} foto ${index + 2}`} className="h-full w-full object-cover" /></div>)}</div>}
          </div>
          <div className="lg:pt-2">
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold">Free Fire</span>{product.featured && <span className="rounded-full bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-300">Unggulan</span>}</div>
            <h1 className="mt-5 text-3xl font-black sm:text-4xl">{product.title}</h1>
            <div className="mt-4 flex items-end gap-3"><p className="text-3xl font-black text-blue-400">{formatAccountPrice(sellingPrice)}</p>{product.discountPrice != null && <p className="pb-1 text-base text-slate-500 line-through">{formatAccountPrice(product.price)}</p>}</div>
            <p className="mt-5 whitespace-pre-line text-base leading-7 text-slate-400">{product.information}</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Bundle", product.bundle], ["Evo Gun", product.evoGun], ["Emote", product.emote], ["Level", product.level]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>)}
            </div>
            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5"><div className="flex items-center gap-3 text-sm text-slate-300"><ShieldCheck className="h-5 w-5 text-emerald-400" />Metode login: {product.login}</div><div className="flex items-center gap-3 text-sm text-slate-300"><PackageCheck className="h-5 w-5 text-emerald-400" />Konfirmasi kembali kepada admin sebelum membayar</div></div>
            {product.availability === "AVAILABLE" ? <a href={`https://wa.me/6285960237306?text=${message}`} target="_blank" rel="noopener noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black hover:bg-emerald-500"><MessageCircle className="h-5 w-5" />Chat Admin untuk Membeli</a> : <div className="mt-6 rounded-2xl bg-slate-700 px-6 py-4 text-center font-black text-slate-300">Produk Tidak Tersedia</div>}
          </div>
        </section>
        <section className="mt-14 border-t border-white/10 pt-10"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Produk Terkait</h2><Link href="/akun" className="text-sm font-bold text-blue-400">Lihat semua</Link></div>{related.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <Link key={item.id} href={`/akun/${item.slug}`} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70"><div className="flex aspect-video items-center justify-center bg-gradient-to-br from-blue-800 to-cyan-500">{item.imageUrls[0] ? <img src={item.imageUrls[0]} alt={item.title} className="h-full w-full object-cover" /> : <Gamepad2 className="h-10 w-10" />}</div><div className="p-4"><p className="font-bold">{item.title}</p><p className="mt-2 font-black text-blue-400">{formatAccountPrice(item.discountPrice ?? item.price)}</p></div></Link>)}</div> : <p className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-slate-400">Belum ada produk lainnya.</p>}</section>
        <Link href="/akun" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Kembali ke daftar akun</Link>
      </div>
    </main>
  );
}
