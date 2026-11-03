import crypto from "crypto";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const COOKIE = "admin_session";
const PERIODS = ["Harian", "Mingguan", "Bulanan", "Tahunan", "Seluruh"] as const;
type Period = (typeof PERIODS)[number];

function validSession(value?: string) {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!value || !password || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(password).digest("hex");
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}
function dateWib(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(value);
}
function wibParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")) };
}
function periodKey(value: Date, period: Period) {
  const { year, month, day } = wibParts(value);
  if (period === "Tahunan") return String(year);
  if (period === "Bulanan") return `${year}-${String(month).padStart(2, "0")}`;
  if (period === "Harian") return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const monday = new Date(Date.UTC(year, month - 1, day));
  const weekday = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - weekday + 1);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const isoYear = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const weekOneMonday = new Date(jan4);
  weekOneMonday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1));
  const week = Math.floor((monday.getTime() - weekOneMonday.getTime()) / 604800000) + 1;
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}
function periodLabel(key: string, period: Period) {
  if (period === "Seluruh") return "Seluruh periode";
  if (period === "Tahunan") return key;
  if (period === "Bulanan") {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  if (period === "Mingguan") {
    const [yearText, weekText] = key.split("-W");
    const year = Number(yearText);
    const week = Number(weekText);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const fmt = (date: Date) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" }).format(date);
    return `${fmt(monday)} – ${fmt(sunday)} ${year}`;
  }
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

type FinanceRow = {
  key: string;
  label: string;
  orders: number;
  revenue: number;
  customerFee: number;
  modal: number;
  affiliate: number;
  expenses: number;
  profit: number;
};
function makeFinanceRows(
  paid: Array<{ createdAt: Date; total: number; payment: { grossAmount: number } | null; providerActualPrice: number | null; providerPriceSnapshot: number | null; affiliateCommission: number }>,
  expenses: Array<{ spentAt: Date; amount: number }>,
  period: Period,
): FinanceRow[] {
  const groups = new Map<string, FinanceRow>();
  const keyFor = (date: Date) => period === "Seluruh" ? "all" : periodKey(date, period);
  const ensure = (key: string, date: Date) => {
    let row = groups.get(key);
    if (!row) {
      row = { key, label: periodLabel(key, period), orders: 0, revenue: 0, customerFee: 0, modal: 0, affiliate: 0, expenses: 0, profit: 0 };
      groups.set(key, row);
    }
    return row;
  };
  for (const order of paid) {
    const key = keyFor(order.createdAt);
    const row = ensure(key, order.createdAt);
    row.orders += 1;
    row.revenue += order.total;
    row.customerFee += Math.max(0, (order.payment?.grossAmount ?? order.total) - order.total);
    row.modal += order.providerActualPrice ?? order.providerPriceSnapshot ?? 0;
    row.affiliate += order.affiliateCommission || 0;
  }
  for (const expense of expenses) {
    const key = keyFor(expense.spentAt);
    const row = ensure(key, expense.spentAt);
    row.expenses += expense.amount;
  }
  for (const row of groups.values()) row.profit = row.revenue - row.modal - row.affiliate - row.expenses;
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const jar = await cookies();
  if (!validSession(jar.get(COOKIE)?.value)) redirect("/admin/login");
  const params = await searchParams;
  const period = PERIODS.includes(params.period as Period) ? (params.period as Period) : "Harian";

  const [orders, expenses, products, promos] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: { in: ["PAID", "SUCCESS", "REFUNDED", "PARTIAL_REFUND"] } },
      include: { product: true, payment: true, promoCode: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.operatingExpense.findMany({ orderBy: { spentAt: "desc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.promoCode.findMany({ orderBy: { usedCount: "desc" }, take: 10 }),
  ]);

  // Refund penuh dikeluarkan dari omzet/laba transaksi lunas.
  // Partial refund akan ditampilkan sebagai status pengecualian sampai nominal refund parsial tersedia.
  const paid = orders.filter((order) => ["PAID", "SUCCESS"].includes(order.paymentStatus));
  const refunded = orders.filter((order) => order.paymentStatus === "REFUNDED");
  const partialRefunds = orders.filter((order) => order.paymentStatus === "PARTIAL_REFUND");
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const costKnown = paid.filter((order) => order.providerActualPrice != null || order.providerPriceSnapshot != null);
  const modal = costKnown.reduce((sum, order) => sum + (order.providerActualPrice ?? order.providerPriceSnapshot ?? 0), 0);
  const estimatedCount = costKnown.filter((order) => order.providerActualPrice == null && order.providerPriceSnapshot != null).length;
  const missingCostCount = paid.length - costKnown.length;
  const paymentFeeCollected = paid.reduce((sum, order) => sum + Math.max(0, (order.payment?.grossAmount ?? order.total) - order.total), 0);
  const affiliate = paid.reduce((sum, order) => sum + (order.affiliateCommission || 0), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const recordedProfit = revenue - modal - affiliate - expenseTotal;
  const promoDiscount = paid.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
  const productAlerts = products.filter((product) => product.price <= product.providerPrice);
  const recentOrders = paid.slice(0, 12);
  const financeRows = makeFinanceRows(paid, expenses, period);
  const chartRows = financeRows.slice(0, 12).reverse();
  const chartMax = Math.max(1, ...chartRows.map((row) => Math.abs(row.profit)));

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-zinc-400 hover:text-white">← Kembali ke Admin</Link>
            <h1 className="mt-3 text-3xl font-bold">Kasir &amp; Keuangan</h1>
            <p className="mt-1 text-sm text-zinc-400">Semua transaksi website · Zona waktu WIB · Data historis tersedia</p>
          </div>
          <a href="/api/admin/finance/export" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10">Ekspor CSV</a>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Omzet transaksi lunas", rupiah(revenue)],
            ["Modal provider", rupiah(modal)],
            ["Fee QRIS dari customer", rupiah(paymentFeeCollected)],
            ["Laba sebelum biaya Midtrans", rupiah(recordedProfit)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-zinc-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Diskon promo terpakai", rupiah(promoDiscount)],
            ["Komisi affiliate", rupiah(affiliate)],
            ["Pengeluaran operasional", rupiah(expenseTotal)],
            ["Order lunas", paid.length.toLocaleString("id-ID")],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs text-zinc-400">{label}</p>
              <p className="mt-1 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100 space-y-2">
          <p className="font-semibold">Catatan akurasi laba</p>
          <p>Laba di atas adalah laba tercatat sebelum biaya MDR/layanan Midtrans. Database belum menyimpan biaya Midtrans per transaksi, jadi biaya tersebut tidak boleh diasumsikan nol.</p>
          <p>Biaya QRIS yang dibayar pelanggan ditampilkan terpisah dan tidak otomatis dianggap sebagai biaya Midtrans.</p>
          <p>Modal: {estimatedCount} transaksi memakai snapshot (estimasi), {missingCostCount} transaksi belum memiliki data modal.</p>
          <p>Refund penuh: {refunded.length} transaksi ({rupiah(refunded.reduce((sum, order) => sum + order.total, 0))}) dikeluarkan dari omzet lunas. Refund parsial: {partialRefunds.length} transaksi perlu pemeriksaan nominal refund.</p>
        </section>

        {productAlerts.length > 0 && (
          <section className="rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
            <h2 className="font-semibold text-red-200">Peringatan harga produk</h2>
            <p className="mt-1 text-sm text-zinc-400">Harga jual saat ini tidak lebih tinggi dari modal provider.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {productAlerts.map((product) => (
                <li key={product.id} className="flex justify-between gap-3">
                  <span>{product.name}</span>
                  <span className="text-red-200">{rupiah(product.price)} / modal {rupiah(product.providerPrice)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
          <div>
            <h2 className="text-xl font-semibold">Laporan laba berdasarkan periode</h2>
            <p className="mt-1 text-sm text-zinc-400">Pilih tampilan untuk mengelompokkan seluruh transaksi historis sejak order pertama.</p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Periode laporan">
            {PERIODS.map((item) => (
              <Link
                key={item}
                href={`/admin/finance?period=${item}`}
                aria-current={period === item ? "page" : undefined}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${period === item ? "border-white bg-white text-black" : "border-white/15 text-zinc-300 hover:bg-white/10"}`}
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Omzet produk", rupiah(revenue)],
              ["Modal provider", rupiah(modal)],
              ["Pengeluaran + komisi", rupiah(expenseTotal + affiliate)],
              ["Laba sebelum biaya Midtrans", rupiah(recordedProfit)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 p-4">
                <p className="text-xs text-zinc-400">{label}</p>
                <p className="mt-2 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Grafik laba · {period}</h3>
            {chartRows.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada transaksi pada periode ini.</p>
            ) : (
              <div className="space-y-3">
                {chartRows.map((row) => (
                  <div key={row.key} className="grid grid-cols-[112px_1fr_auto] items-center gap-3 text-xs sm:grid-cols-[150px_1fr_auto]">
                    <span className="truncate text-zinc-400">{row.label}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${row.profit < 0 ? "bg-red-400" : "bg-emerald-400"}`}
                        style={{ width: `${Math.max(1, (Math.abs(row.profit) / chartMax) * 100)}%` }}
                      />
                    </div>
                    <span className={row.profit < 0 ? "text-red-300" : "text-emerald-300"}>{rupiah(row.profit)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="pb-3">Periode</th>
                  <th className="pb-3 text-right">Order</th>
                  <th className="pb-3 text-right">Omzet</th>
                  <th className="pb-3 text-right">Modal</th>
                  <th className="pb-3 text-right">Fee customer</th>
                  <th className="pb-3 text-right">Biaya + komisi</th>
                  <th className="pb-3 text-right">Laba tercatat</th>
                </tr>
              </thead>
              <tbody>
                {financeRows.map((row) => (
                  <tr key={row.key} className="border-t border-white/5">
                    <td className="py-3">{row.label}</td>
                    <td className="text-right">{row.orders.toLocaleString("id-ID")}</td>
                    <td className="text-right">{rupiah(row.revenue)}</td>
                    <td className="text-right">{rupiah(row.modal)}</td>
                    <td className="text-right">{rupiah(row.customerFee)}</td>
                    <td className="text-right">{rupiah(row.expenses + row.affiliate)}</td>
                    <td className={`text-right font-semibold ${row.profit < 0 ? "text-red-300" : "text-emerald-300"}`}>{rupiah(row.profit)}</td>
                  </tr>
                ))}
                {financeRows.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-zinc-500">Belum ada data transaksi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Tambah pengeluaran</h2>
            <p className="mt-1 text-sm text-zinc-400">Input biaya operasional toko. Pemasukan tetap tercatat otomatis dari order website.</p>
            <form action="/api/admin/finance/expenses" method="post" className="mt-4 space-y-3">
              <select name="category" required className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm">
                <option value="Operasional">Operasional</option><option value="Promosi">Promosi</option><option value="Internet">Internet</option><option value="Layanan">Layanan / langganan</option><option value="Lainnya">Lainnya</option>
              </select>
              <input name="description" required maxLength={160} placeholder="Keterangan pengeluaran" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm" />
              <input name="amount" required type="number" min="1" step="1" placeholder="Nominal (Rupiah)" className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm" />
              <input name="spentAt" required type="date" defaultValue={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })} className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm" />
              <button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200">Simpan pengeluaran</button>
            </form>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Riwayat pengeluaran</h2>
            <div className="mt-4 space-y-3">
              {expenses.length === 0 ? <p className="text-sm text-zinc-500">Belum ada pengeluaran.</p> : expenses.map((expense) => (
                <div key={expense.id} className="flex items-start justify-between gap-3 border-b border-white/5 pb-3">
                  <div><p className="text-sm font-medium">{expense.description}</p><p className="text-xs text-zinc-500">{expense.category} · {dateWib(expense.spentAt)}</p></div>
                  <p className="whitespace-nowrap text-sm">{rupiah(expense.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold">Analisis promo</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-zinc-500"><tr><th className="pb-3">Kode</th><th className="pb-3">Nama</th><th className="pb-3 text-right">Terpakai</th><th className="pb-3 text-right">Status</th></tr></thead>
              <tbody>{promos.map((promo) => (
                <tr key={promo.id} className="border-t border-white/5"><td className="py-3 font-mono">{promo.code}</td><td>{promo.name || "—"}</td><td className="text-right">{promo.usedCount}</td><td className="text-right">{promo.active ? "Aktif" : "Nonaktif"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold">Transaksi website terbaru</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-zinc-500"><tr><th className="pb-3">Tanggal</th><th className="pb-3">Invoice</th><th className="pb-3">Produk</th><th className="pb-3 text-right">Omzet</th><th className="pb-3 text-right">Modal</th><th className="pb-3 text-right">Status modal</th></tr></thead>
              <tbody>{recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-white/5">
                  <td className="py-3">{dateWib(order.createdAt)}</td><td className="font-mono">{order.invoice}</td><td>{order.product.name}</td><td className="text-right">{rupiah(order.total)}</td>
                  <td className="text-right">{order.providerActualPrice != null ? rupiah(order.providerActualPrice) : order.providerPriceSnapshot != null ? rupiah(order.providerPriceSnapshot) : "—"}</td>
                  <td className="text-right text-xs text-zinc-400">{order.providerActualPrice != null ? "Aktual" : order.providerPriceSnapshot != null ? "Snapshot" : "Belum ada"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
