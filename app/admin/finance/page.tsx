import crypto from "crypto";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const COOKIE = "admin_session";
function validSession(value?: string) {
  const password = process.env.ADMIN_PASSWORD; const secret = process.env.ADMIN_SESSION_SECRET;
  if (!value || !password || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(password).digest("hex");
  const a = Buffer.from(value); const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}
function dateWib(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(value);
}
export default async function AdminFinancePage() {
  const jar = await cookies();
  if (!validSession(jar.get(COOKIE)?.value)) redirect("/admin/login");
  const [orders, expenses, products, promos] = await Promise.all([
    prisma.order.findMany({ where: { paymentStatus: { in: ["PAID", "SUCCESS", "REFUNDED", "PARTIAL_REFUND"] } }, include: { product: true, payment: true, promoCode: true }, orderBy: { createdAt: "desc" } }),
    prisma.operatingExpense.findMany({ orderBy: { spentAt: "desc" }, take: 100 }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.promoCode.findMany({ orderBy: { usedCount: "desc" }, take: 10 }),
  ]);
  const paid = orders.filter(o => ["PAID", "SUCCESS"].includes(o.paymentStatus));
  const revenue = paid.reduce((sum, o) => sum + o.total, 0);
  const costKnown = paid.filter(o => o.providerActualPrice != null || o.providerPriceSnapshot != null);
  const modal = costKnown.reduce((sum, o) => sum + (o.providerActualPrice ?? o.providerPriceSnapshot ?? 0), 0);
  const estimatedCount = costKnown.filter(o => o.providerActualPrice == null && o.providerPriceSnapshot != null).length;
  const missingCostCount = paid.length - costKnown.length;
  const paymentFeeCollected = paid.reduce((sum, o) => sum + Math.max(0, (o.payment?.grossAmount ?? o.total) - o.total), 0);
  const affiliate = paid.reduce((sum, o) => sum + (o.affiliateCommission || 0), 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const knownProfit = revenue - modal - affiliate - expenseTotal;
  const promoDiscount = paid.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const productAlerts = products.filter(p => p.price <= p.providerPrice);
  const recentOrders = paid.slice(0, 12);
  return <main className="min-h-screen bg-[#09090b] px-4 py-8 text-white sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin" className="text-sm text-zinc-400 hover:text-white">← Kembali ke Admin</Link><h1 className="mt-3 text-3xl font-bold">Kasir &amp; Keuangan</h1><p className="mt-1 text-sm text-zinc-400">Semua transaksi website · Zona waktu WIB · Data historis tersedia</p></div><a href="/api/admin/finance/export" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10">Ekspor CSV</a></div>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Omzet transaksi lunas",rupiah(revenue)],["Modal provider",rupiah(modal)],["Fee pembayaran dari customer",rupiah(paymentFeeCollected)],["Estimasi laba operasional",rupiah(knownProfit)]].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Diskon promo terpakai",rupiah(promoDiscount)],["Komisi affiliate",rupiah(affiliate)],["Pengeluaran operasional",rupiah(expenseTotal)],["Order lunas",paid.length.toLocaleString("id-ID")]].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-zinc-400">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>)}</section>
    {(estimatedCount>0||missingCostCount>0)&&<div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">Perhatian data modal: {estimatedCount} order memakai snapshot modal (estimasi), {missingCostCount} order belum memiliki data modal. Laba di atas adalah estimasi dan belum memasukkan order yang modalnya tidak diketahui. Fee pembayaran customer ditampilkan terpisah dan tidak dihitung sebagai biaya toko.</div>}
    {productAlerts.length>0&&<section className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5"><h2 className="font-semibold text-red-200">Peringatan harga produk</h2><p className="mt-1 text-sm text-zinc-400">Harga jual saat ini tidak lebih tinggi dari modal provider.</p><ul className="mt-3 space-y-2 text-sm">{productAlerts.map(p=><li key={p.id} className="flex justify-between gap-3"><span>{p.name}</span><span className="text-red-200">{rupiah(p.price)} / modal {rupiah(p.providerPrice)}</span></li>)}</ul></section>}
    <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg font-semibold">Tambah pengeluaran</h2><p className="mt-1 text-sm text-zinc-400">Input biaya operasional toko. Pemasukan tetap tercatat otomatis dari order website.</p><form action="/api/admin/finance/expenses" method="post" className="mt-4 space-y-3"><select name="category" required className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm"><option value="Operasional">Operasional</option><option value="Promosi">Promosi</option><option value="Internet">Internet</option><option value="Layanan">Layanan / langganan</option><option value="Lainnya">Lainnya</option></select><input name="description" required maxLength={160} placeholder="Keterangan pengeluaran" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm"/><input name="amount" required type="number" min="1" step="1" placeholder="Nominal (Rupiah)" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm"/><input name="spentAt" required type="date" defaultValue={new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"})} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm"/><button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200">Simpan pengeluaran</button></form></div>
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg font-semibold">Riwayat pengeluaran</h2><div className="mt-4 space-y-3">{expenses.length===0?<p className="text-sm text-zinc-500">Belum ada pengeluaran.</p>:expenses.map(e=><div key={e.id} className="flex items-start justify-between gap-3 border-b border-white/5 pb-3"><div><p className="text-sm font-medium">{e.description}</p><p className="text-xs text-zinc-500">{e.category} · {dateWib(e.spentAt)}</p></div><p className="whitespace-nowrap text-sm">{rupiah(e.amount)}</p></div>)}</div></div></section>
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg font-semibold">Analisis promo</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="text-zinc-500"><tr><th className="pb-3">Kode</th><th className="pb-3">Nama</th><th className="pb-3 text-right">Terpakai</th><th className="pb-3 text-right">Status</th></tr></thead><tbody>{promos.map(p=><tr key={p.id} className="border-t border-white/5"><td className="py-3 font-mono">{p.code}</td><td>{p.name||"—"}</td><td className="text-right">{p.usedCount}</td><td className="text-right">{p.active?"Aktif":"Nonaktif"}</td></tr>)}</tbody></table></div></section>
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg font-semibold">Transaksi website terbaru</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-zinc-500"><tr><th className="pb-3">Tanggal</th><th className="pb-3">Invoice</th><th className="pb-3">Produk</th><th className="pb-3 text-right">Omzet</th><th className="pb-3 text-right">Modal</th><th className="pb-3 text-right">Status modal</th></tr></thead><tbody>{recentOrders.map(o=><tr key={o.id} className="border-t border-white/5"><td className="py-3">{dateWib(o.createdAt)}</td><td className="font-mono">{o.invoice}</td><td>{o.product.name}</td><td className="text-right">{rupiah(o.total)}</td><td className="text-right">{o.providerActualPrice!=null?rupiah(o.providerActualPrice):o.providerPriceSnapshot!=null?rupiah(o.providerPriceSnapshot):"—"}</td><td className="text-right text-xs text-zinc-400">{o.providerActualPrice!=null?"Aktual":o.providerPriceSnapshot!=null?"Snapshot":"Belum ada"}</td></tr>)}</tbody></table></div></section>
  </div></main>;
}