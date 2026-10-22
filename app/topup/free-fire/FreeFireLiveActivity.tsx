"use client";

import { useEffect, useState } from "react";

type Purchase = {
  productName: string;
  userId: string;
  createdAt: string;
};

type LiveStats = {
  totalTransactions: number;
  recentPurchases: Purchase[];
};

function timeAgo(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return "Hari ini";
}

export default function FreeFireLiveActivity() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/free-fire/live-stats", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as LiveStats;
        if (cancelled) return;

        const recent = Array.isArray(data.recentPurchases)
          ? data.recentPurchases.filter((purchase) => {
              const timestamp = new Date(purchase.createdAt).getTime();
              return Number.isFinite(timestamp) && Date.now() - timestamp < 24 * 60 * 60 * 1000;
            })
          : [];

        setStats({
          totalTransactions: Number.isFinite(data.totalTransactions)
            ? data.totalTransactions
            : 0,
          recentPurchases: recent,
        });
        setActiveIndex((current) => recent.length ? current % recent.length : 0);
      } catch {
        // Social proof is optional; never interrupt checkout if stats are unavailable.
      }
    }

    void loadStats();
    const poll = window.setInterval(() => void loadStats(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!stats?.recentPurchases.length) {
      setVisible(false);
      return;
    }
    const showTimer = window.setTimeout(() => setVisible(true), 2500);
    const rotateTimer = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setActiveIndex((index) => (index + 1) % stats.recentPurchases.length);
        setVisible(true);
      }, 450);
    }, 9000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearInterval(rotateTimer);
    };
  }, [stats?.recentPurchases.length]);

  const purchase = stats?.recentPurchases[activeIndex];

  return (
    <>
      {stats && (
        <div className="mx-auto mt-5 w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <strong>{stats.totalTransactions.toLocaleString("id-ID")}</strong> transaksi berhasil
          <span className="ml-2 text-emerald-100/60">· diperbarui tiap 30 detik</span>
        </div>
      )}

      {purchase && (
        <aside
          aria-live="polite"
          className={`fixed bottom-4 left-4 z-50 w-[min(330px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#20232b]/95 p-3 text-white shadow-2xl backdrop-blur transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/30 text-2xl">
              💎
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-400">Transaksi berhasil</p>
              <p className="mt-0.5 text-sm leading-5 text-white">
                Pembelian <strong>{purchase.productName}</strong>
              </p>
              <p className="mt-1 text-xs text-slate-300">UID: <strong>{purchase.userId}</strong></p>
              <p className="mt-1 text-xs text-slate-400">{timeAgo(purchase.createdAt)}</p>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
