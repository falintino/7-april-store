import Link from "next/link";
import { ArrowRight, BadgeCheck, Gamepad2, PackageCheck, ShieldCheck } from "lucide-react";
import { formatAccountPrice, getPublicAccountProducts } from "@/lib/account-products";

export const dynamic = "force-dynamic";

function statusLabel(value: string) {
  return value === "AVAILABLE" ? "Tersedia" : value === "RESERVED" ? "Dipesan" : "Terjual";
}

export default async function AkunPage() {
  const products = await getPublicAccountProducts();

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-10 text-white sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300"><Gamepad2 className="h-4 w-4" />Marketplace Akun</span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Akun Game Tersedia</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">Pilih akun, lihat koleksi dan detailnya, lalu konfirmasi stok langsung kepada admin.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300"><PackageCheck className="h-5 w-5" />{products.filter((item) => item.availability === "AVAILABLE").length} produk tersedia</div>
        </div>

        <section aria-label="Daftar akun game" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const sellingPrice = product.discountPrice ?? product.price;
            return (
              <article key={product.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-blue-500/50">
                <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-blue-800 to-cyan-500">
                  {product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <Gamepad2 className="h-14 w-14 text-white" />}
                  <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg ${product.availability === "AVAILABLE" ? "bg-emerald-500" : product.availability === "RESERVED" ? "bg-amber-500" : "bg-slate-600"}`}><BadgeCheck className="h-4 w-4" />{statusLabel(product.availability)}</span>
                  {product.discountPrice != null && <span className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1.5 text-xs font-black">DISKON</span>}
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-sm font-semibold text-blue-400">FREE FIRE</p>
                  <h2 className="mt-1 text-xl font-bold">{product.title}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-2xl font-black">{formatAccountPrice(sellingPrice)}</p>
                    {product.discountPrice != null && <p className="text-sm text-slate-500 line-through">{formatAccountPrice(product.price)}</p>}
                  </div>
                  <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                    {[["Bundle", product.bundle], ["Evo", product.evoGun], ["Emote", product.emote], ["Level", product.level]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-1 py-3"><p className="text-lg font-bold">{value}</p><p className="mt-1 text-[11px] text-slate-400">{label}</p></div>)}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-400" />Login {product.login}</div>
                  <Link href={`/akun/${product.slug}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold transition hover:bg-blue-500">Lihat Detail<ArrowRight className="h-4 w-4" /></Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
