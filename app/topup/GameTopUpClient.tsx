"use client";

import { useState } from "react";

type Product = { id: string; name: string; sku: string; price: number; popular: boolean };
type Game = "Mobile Legends" | "Roblox";

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default function GameTopUpClient({ game, products }: { game: Game; products: Product[] }) {
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = products.find((p) => p.id === selectedId) ?? null;
  const idValid = game === "Mobile Legends"
    ? /^\d{5,20}$/.test(playerId) && /^\d{1,6}$/.test(zoneId)
    : /^[A-Za-z0-9_]{3,20}$/.test(playerId.trim());
  const whatsappValid = /^\d{10,15}$/.test(whatsapp);

  async function checkout() {
    if (loading) return;
    if (!idValid) {
      setError(game === "Mobile Legends"
        ? "Masukkan User ID dan Zone ID Mobile Legends dengan benar."
        : "Masukkan username Roblox yang valid (3–20 huruf, angka, atau garis bawah).");
      return;
    }
    if (!whatsappValid) {
      setError("Masukkan nomor WhatsApp 10–15 digit.");
      return;
    }
    if (!selected) {
      setError("Pilih nominal produk terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const customerNo = game === "Mobile Legends"
        ? `${playerId.trim()}(${zoneId.trim()})`
        : playerId.trim();
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: customerNo, whatsapp, productId: selected.id }),
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.message || "Pesanan gagal dibuat.");
      const invoice = String(orderData.order?.invoice ?? "");
      if (!invoice) throw new Error("Nomor invoice tidak ditemukan.");

      const paymentResponse = await fetch("/api/midtrans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice, paymentMethod: "qris" }),
      });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.message || "Pembayaran gagal dibuat.");
      if (!paymentData.redirectUrl) throw new Error("Link pembayaran tidak ditemukan.");
      window.location.href = paymentData.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
        <h2 className="text-xl font-black">1. Masukkan data akun</h2>
        <p className="mt-2 text-sm text-slate-400">Periksa data sebelum melanjutkan. Pesanan digital yang sudah terkirim biasanya tidak dapat dibatalkan.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className={game === "Roblox" ? "sm:col-span-2" : ""}>
            <label className="mb-2 block text-xs font-bold text-slate-300">{game === "Mobile Legends" ? "User ID" : "Username Roblox"}</label>
            <input value={playerId} onChange={(e) => setPlayerId(game === "Mobile Legends" ? e.target.value.replace(/\D/g, "").slice(0, 20) : e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 20)} disabled={loading} placeholder={game === "Mobile Legends" ? "Contoh: 123456789" : "Contoh: RobloxUser"} className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60" />
          </div>
          {game === "Mobile Legends" && <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">Zone ID / Server ID</label>
            <input value={zoneId} onChange={(e) => setZoneId(e.target.value.replace(/\D/g, "").slice(0, 6))} disabled={loading} placeholder="Contoh: 1234" className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60" />
          </div>}
          <div className={game === "Mobile Legends" ? "sm:col-span-2" : ""}>
            <label className="mb-2 block text-xs font-bold text-slate-300">Nomor WhatsApp</label>
            <input inputMode="numeric" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 15))} disabled={loading} placeholder="Contoh: 08xxxxxxxxxx" className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60" />
          </div>
        </div>

        <h2 className="mt-8 text-xl font-black">2. Pilih produk</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => <button key={product.id} type="button" onClick={() => setSelectedId(product.id)} disabled={loading} className={`rounded-xl border p-4 text-left transition ${selectedId === product.id ? "border-blue-400 bg-blue-500/10 ring-1 ring-blue-400/30" : "border-white/10 bg-[#060b16] hover:border-white/20"}`}>
            <span className="block text-sm font-bold">{product.name}</span>
            <span className="mt-2 block text-sm font-black text-blue-300">{rupiah(product.price)}</span>
            {selectedId === product.id && <span className="mt-2 block text-[10px] font-bold text-blue-300">DIPILIH</span>}
          </button>)}
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button type="button" onClick={() => void checkout()} disabled={loading || !products.length} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Menyiapkan pembayaran…" : selected ? `Bayar ${rupiah(selected.price)} via QRIS` : "Pilih produk terlebih dahulu"}</button>
        <p className="mt-3 text-xs leading-5 text-slate-500">Pembayaran diproses melalui Midtrans. Pesanan baru diteruskan ke Digiflazz setelah pembayaran terkonfirmasi.</p>
      </div>

      <aside className="h-fit rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <h3 className="font-black">Ringkasan pesanan</h3>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3"><span className="text-slate-400">Game</span><span className="text-right font-semibold">{game}</span></div>
          <div className="flex justify-between gap-3"><span className="text-slate-400">Produk</span><span className="text-right font-semibold">{selected?.name ?? "Belum dipilih"}</span></div>
          <div className="border-t border-white/10 pt-3 flex justify-between gap-3"><span className="text-slate-400">Harga produk</span><span className="font-black text-blue-300">{selected ? rupiah(selected.price) : "—"}</span></div>
        </div>
        <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100">{game === "Mobile Legends" ? "User ID dan Zone ID harus cocok. Sistem mengirim tujuan dengan format UserID(ZoneID)." : "Pastikan SKU yang aktif adalah produk top-up langsung. Voucher/kode redeem harus menggunakan alur penyerahan yang berbeda."}</div>
      </aside>
    </section>
  );
}
