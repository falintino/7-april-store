import type { Metadata } from "next";
import { Crown, Medal, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard Pembelian",
  description: "Lihat pelanggan dengan total transaksi top up berhasil tertinggi di 7 April Store hari ini, minggu ini, dan bulan ini.",
  alternates: { canonical: "https://store.falintino.com/leaderboard" },
};

type Leader = {
  identityKey: string;
  customerName: string | null;
  totalSpent: bigint;
  orderCount: bigint;
};

function getWibRanges() {
  const now = new Date();
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const year = wibNow.getUTCFullYear();
  const month = wibNow.getUTCMonth();
  const day = wibNow.getUTCDate();
  const weekday = wibNow.getUTCDay();
  const sinceMonday = (weekday + 6) % 7;
  const today = new Date(Date.UTC(year, month, day) - 7 * 60 * 60 * 1000);
  const week = new Date(Date.UTC(year, month, day - sinceMonday) - 7 * 60 * 60 * 1000);
  const monthStart = new Date(Date.UTC(year, month, 1) - 7 * 60 * 60 * 1000);
  return [
    { key: "today", title: "Sultan Hari Ini", start: today, end: now, caption: "Mulai pukul 00.00 WIB" },
    { key: "week", title: "Sultan Minggu Ini", start: week, end: now, caption: "Senin sampai sekarang · WIB" },
    { key: "month", title: "Sultan Bulan Ini", start: monthStart, end: now, caption: "Awal bulan sampai sekarang · WIB" },
  ];
}

async function getLeaders(start: Date, end: Date): Promise<Leader[]> {
  return prisma.$queryRaw<Leader[]>`
    SELECT
      COALESCE(o."customerId", 'whatsapp:' || o."whatsapp") AS "identityKey",
      MAX(c."name") AS "customerName",
      SUM(o."total")::bigint AS "totalSpent",
      COUNT(*)::bigint AS "orderCount"
    FROM "Order" o
    LEFT JOIN "Customer" c ON c."id" = o."customerId"
    WHERE o."paymentStatus" = 'PAID'
      AND o."providerStatus" = 'SUCCESS'
      AND o."createdAt" >= ${start}
      AND o."createdAt" < ${end}
    GROUP BY COALESCE(o."customerId", 'whatsapp:' || o."whatsapp")
    ORDER BY SUM(o."total") DESC
    LIMIT 10
  `;
}

function maskName(name: string | null, identityKey: string) {
  if (name?.trim()) {
    const firstName = name.trim().split(/\s+/)[0];
    const prefix = Array.from(firstName).slice(0, Math.min(2, Array.from(firstName).length)).join("");
    return `${prefix}${"*".repeat(Math.max(3, Math.min(6, Array.from(firstName).length + 1)))}`;
  }
  if (identityKey.startsWith("whatsapp:")) {
    const phone = identityKey.slice("whatsapp:".length);
    if (phone.length >= 6) return `${phone.slice(0, 2)}••••${phone.slice(-3)}`;
  }
  return "Pelanggan";
}

function rupiah(value: bigint) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

const medals = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const ranges = getWibRanges();
  const boards = await Promise.all(ranges.map(async (range) => ({
    ...range,
    leaders: await getLeaders(range.start, range.end),
  })));

  return (
    <main className="min-h-screen bg-[#030712] pb-20 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-[#030712] to-[#030712] px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            <Trophy size={15} /> Peringkat pelanggan
          </div>
          <h1 className="mt-5 text-3xl font-black sm:text-5xl">Leaderboard 7 April Store</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Top 10 pelanggan berdasarkan total nilai transaksi top up yang pembayarannya sudah lunas dan pengiriman game berhasil.
          </p>
          <p className="mt-3 text-xs text-slate-500">Diperbarui saat halaman dibuka · Zona waktu WIB · Nama pelanggan disamarkan</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-3 sm:px-8">
        {boards.map((board, boardIndex) => {
          const Icon = boardIndex === 0 ? Crown : boardIndex === 1 ? Medal : Trophy;
          return (
            <article key={board.key} className="overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#07101f] shadow-xl shadow-blue-950/20">
              <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
                    <Icon size={23} />
                  </div>
                  <div>
                    <h2 className="font-black">{board.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">{board.caption}</p>
                  </div>
                </div>
              </div>

              {board.leaders.length ? (
                <ol className="divide-y divide-white/[0.06] px-4">
                  {board.leaders.map((leader, index) => (
                    <li key={leader.identityKey} className="flex items-center gap-3 py-4">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${index < 3 ? "bg-cyan-400/10 text-cyan-300" : "bg-white/[0.04] text-slate-500"}`}>
                        {medals[index] ?? `#${index + 1}`}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-100">{maskName(leader.customerName, leader.identityKey)}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{Number(leader.orderCount).toLocaleString("id-ID")} transaksi berhasil</p>
                      </div>
                      <p className="shrink-0 text-right text-xs font-black text-cyan-300 sm:text-sm">{rupiah(leader.totalSpent)}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="px-5 py-12 text-center">
                  <Trophy className="mx-auto text-slate-600" size={30} />
                  <p className="mt-3 text-sm font-semibold text-slate-300">Belum ada transaksi sukses</p>
                  <p className="mt-1 text-xs text-slate-500">Peringkat akan terisi setelah pesanan lunas dan berhasil dikirim.</p>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-5 text-slate-500">
          Catatan: leaderboard dihitung dari pesanan dengan status pembayaran PAID dan status pengiriman SUCCESS. Pesanan pending, gagal, atau belum terkirim tidak dihitung. Total ditampilkan berdasarkan nilai pesanan, bukan keuntungan toko.
        </p>
      </div>
    </main>
  );
}
