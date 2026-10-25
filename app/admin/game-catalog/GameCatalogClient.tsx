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
type Payload = { success: boolean; message?: string; candidates?: CatalogItem[]; products?: StoredProduct[] };

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default function GameCatalogClient() {
  const [candidates, setCandidates] = useState<CatalogItem[]>([]);
  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySku, setBusySku] = useState("");
  const [message, setMessage] = useState("");
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
          {loading ? <p className="text-sm text-slate-400">Mengambil daftar harga…</p> : candidates.length === 0 ? <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">Tidak ada SKU Mobile Legends/Roblox yang aktif di daftar harga Buyer. Tambahkan dan aktifkan produk di panel Digiflazz, lalu muat ulang.</p> : (
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
