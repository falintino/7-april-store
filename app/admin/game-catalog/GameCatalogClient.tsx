"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CatalogItem = {
  game: "Mobile Legends" | "Roblox";
  name: string;
  sku: string;
  providerCode: string;
  providerPrice: number;
  suggestedPrice: number;
  category: string;
  brand: string;
  type: string;
  description: string;
  buyerActive: boolean;
  sellerActive: boolean;
};
type StoredProduct = {
  id: string;
  game: string;
  name: string;
  sku: string;
  providerCode: string;
  price: number;
  providerPrice: number;
  active: boolean;
};
type Payload = { success: boolean; message?: string; catalogError?: boolean; candidates?: CatalogItem[]; products?: StoredProduct[] };

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

const competitorPrices: Record<number, number> = {
  5: 1597, 10: 3194, 12: 3831, 18: 6014, 19: 6014,
  28: 8748, 36: 11479, 44: 13133, 46: 14769, 54: 16422,
  59: 17505, 71: 21335, 74: 22424, 85: 25163, 90: 26808,
  110: 33903, 113: 33911,
};

const recommendedPrices: Record<number, number> = {
  5: 1589, 10: 3189, 12: 3799, 18: 5999, 19: 5999,
  28: 8699, 36: 11399, 44: 13099, 46: 14699, 54: 16399,
  59: 17499, 71: 21299, 74: 22399, 85: 25099, 90: 26799,
  110: 33899, 113: 33899,
};

function diamondAmount(product: StoredProduct): number | null {
  const skuMatch = product.sku.match(/^ml(\d{1,4})$/i);
  const nameMatch = product.name.match(/\b(\d{1,4})\s*diamond\b/i);
  const amount = Number(skuMatch?.[1] ?? nameMatch?.[1]);
  return Number.isSafeInteger(amount) && competitorPrices[amount] ? amount : null;
}

export default function GameCatalogClient() {
  const [candidates, setCandidates] = useState<CatalogItem[]>([]);
  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySku, setBusySku] = useState("");
  const [message, setMessage] = useState("");
  const [catalogError, setCatalogError] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [robloxConfirmed, setRobloxConfirmed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/game-catalog", { cache: "no-store" });
      const data = await response.json() as Payload;
      if (!response.ok || !data.success) throw new Error(data.message || "Gagal memuat katalog.");
      setCandidates(data.candidates ?? []);
      setProducts(data.products ?? []);
      setCatalogError(Boolean(data.catalogError));
      setPrices(Object.fromEntries((data.products ?? []).map((p) => [p.sku, String(p.price)])));
      setActive(Object.fromEntries((data.products ?? []).map((p) => [p.sku, p.active])));
      setMessage(data.message ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat katalog Digiflazz.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function importProduct(item: CatalogItem) {
    setBusySku(item.sku);
    setMessage("");
    try {
      const response = await fetch("/api/admin/game-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: item.sku, game: item.game }),
      });
      const data = await response.json() as { success?: boolean; message?: string };
      setMessage(data.message ?? (response.ok ? "Produk diimpor." : "Import gagal."));
      if (response.ok && data.success) await load();
    } catch {
      setMessage("Gagal mengimpor SKU. Periksa koneksi dan coba lagi.");
    } finally {
      setBusySku("");
    }
  }

  async function saveProduct(product: StoredProduct) {
    const price = Number(prices[product.sku] ?? product.price);
    const nextActive = Boolean(active[product.sku]);
    if (nextActive && product.game === "Roblox" && !robloxConfirmed[product.sku]) {
      setMessage("Untuk Roblox, centang konfirmasi format top-up langsung sebelum mengaktifkan.");
      return;
    }
    setBusySku(product.sku);
    setMessage("");
    try {
      const response = await fetch("/api/admin/game-catalog/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: product.sku,
          price,
          active: nextActive,
          confirmDeliveryType: Boolean(robloxConfirmed[product.sku]),
        }),
      });
      const data = await response.json() as { success?: boolean; message?: string };
      setMessage(data.message ?? (response.ok ? "Produk diperbarui." : "Gagal memperbarui produk."));
      if (response.ok && data.success) await load();
    } catch {
      setMessage("Gagal menyimpan produk. Coba lagi.");
    } finally {
      setBusySku("");
    }
  }

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">7 April Store · Admin</p>
            <h1 className="mt-2 text-3xl font-black">Katalog Mobile Legends & Roblox</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Tarik daftar harga Buyer Digiflazz, impor produk yang cocok, periksa harga jual, lalu aktifkan satu per satu. Produk baru selalu masuk dalam keadaan nonaktif.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/5 disabled:opacity-50">{loading ? "Memuat..." : "Muat Ulang Katalog"}</button>
            <Link href="/admin" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-500">Kembali ke Admin</Link>
          </div>
        </div>

        {message && <div role="status" className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">{message}</div>}

        <section className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <h2 className="font-bold text-amber-200">Penting sebelum mengaktifkan</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
            <li>SKU harus sudah ditambahkan dan aktif di akun Buyer Digiflazz kamu.</li>
            <li>Produk baru tidak otomatis dijual; cek modal, harga jual, dan status supplier.</li>
            <li>Untuk Mobile Legends, checkout mengirim tujuan dalam format <code>USERID(ZONEID)</code>.</li>
            <li>Untuk Roblox, aktifkan hanya SKU top-up langsung yang memang menerima ID/username sebagai tujuan. Jangan aktifkan voucher/kode redeem di halaman top-up langsung.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-black">Produk aktif di daftar harga Digiflazz</h2>
          {loading ? <p className="text-sm text-slate-400">Mengambil daftar harga…</p> : candidates.length === 0 ? <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">{catalogError ? "Daftar harga belum berhasil dibaca. Produk yang sudah diimpor tetap dapat diatur di bawah; coba muat ulang beberapa saat lagi." : "Tidak ada SKU Mobile Legends/Roblox yang aktif di daftar harga Buyer. Tambahkan dan aktifkan produk di panel Digiflazz, lalu muat ulang."}</p> : (
            <div className="grid gap-3 lg:grid-cols-2">
              {candidates.map((item) => {
                const imported = products.some((p) => p.sku === item.sku);
                return <article key={item.sku} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-300">{item.game}</span><h3 className="mt-2 font-bold">{item.name}</h3><p className="mt-1 text-xs text-slate-500">SKU: <code>{item.sku}</code> · {item.brand} · {item.type}</p></div>
                    <div className="text-right"><p className="text-xs text-slate-500">Modal Digiflazz</p><p className="font-black">{rupiah(item.providerPrice)}</p><p className="mt-1 text-xs text-slate-400">Saran harga awal {rupiah(item.suggestedPrice)}</p></div>
                  </div>
                  {item.description && <p className="mt-3 text-xs leading-5 text-slate-400">{item.description}</p>}
                  <button onClick={() => void importProduct(item)} disabled={Boolean(busySku) || imported} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{imported ? "Sudah Diimpor" : busySku === item.sku ? "Mengimpor…" : "Impor sebagai Nonaktif"}</button>
                </article>;
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xl font-black">Produk yang sudah diimpor</h2>
          {products.length === 0 ? <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">Belum ada produk yang diimpor.</p> : <div className="grid gap-3 lg:grid-cols-2">
            {products.map((product) => <article key={product.sku} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold text-blue-300">{product.game}</span><h3 className="mt-1 font-bold">{product.name}</h3><p className="mt-1 text-xs text-slate-500">SKU: <code>{product.sku}</code></p></div><span className={product.active ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300" : "rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-slate-300"}>{product.active ? "AKTIF" : "NONAKTIF"}</span></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-xs text-slate-400">Modal Digiflazz</label><p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">{rupiah(product.providerPrice)}</p></div>
                <div><label className="mb-1 block text-xs text-slate-400">Harga jual (Rp)</label><input type="number" min={product.providerPrice} step={1} value={prices[product.sku] ?? product.price} onChange={(e) => setPrices((current) => ({ ...current, [product.sku]: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
              </div>
              {product.game === "Mobile Legends" && (() => {
                const amount = diamondAmount(product);
                const target = amount === null ? null : recommendedPrices[amount];
                const competitor = amount === null ? null : competitorPrices[amount];
                const margin = target === null ? null : target - product.providerPrice;
                return target !== null && competitor !== null && margin !== null ? (
                  <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs">
                    <p className="text-slate-300">Harga pesaing: <strong>{rupiah(competitor)}</strong> · Target 7 April Store: <strong>{rupiah(target)}</strong></p>
                    <p className={margin > 0 ? "mt-1 text-green-300" : "mt-1 text-amber-300"}>Selisih dari modal: {rupiah(margin)}{margin <= 0 ? " — target ini tidak aman, jangan digunakan." : " sebelum biaya pembayaran."}</p>
                    <button type="button" disabled={margin <= 0} onClick={() => setPrices((current) => ({ ...current, [product.sku]: String(target) }))} className="mt-2 rounded-lg border border-blue-400/30 px-3 py-2 font-bold text-blue-200 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40">Pakai harga saingan</button>
                  </div>
                ) : null;
              })()}
              <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(active[product.sku])} onChange={(e) => setActive((current) => ({ ...current, [product.sku]: e.target.checked }))} /> Tampilkan dan izinkan pembelian di website</label>
              {product.game === "Roblox" && <label className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100"><input type="checkbox" checked={Boolean(robloxConfirmed[product.sku])} onChange={(e) => setRobloxConfirmed((current) => ({ ...current, [product.sku]: e.target.checked }))} className="mt-1" /> Saya sudah memastikan SKU ini adalah top-up langsung, bukan voucher/kode redeem.</label>}
              <button onClick={() => void saveProduct(product)} disabled={busySku === product.sku} className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold hover:bg-green-500 disabled:opacity-50">{busySku === product.sku ? "Menyimpan…" : "Simpan Pengaturan"}</button>
            </article>)}
          </div>}
        </section>
      </div>
    </main>
  );
}
