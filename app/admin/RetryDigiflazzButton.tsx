"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  invoice: string;
  providerStatus: string;
  providerRc: string | null;
  manualFulfilled?: boolean;
};

export default function RetryDigiflazzButton({
  invoice,
  providerStatus,
  providerRc,
  manualFulfilled = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Show recovery for every paid order awaiting refund with a known provider RC.
  // RC70 is handled safely by the backend using the existing ref_id.
  const allowedRetry =
    providerStatus === "REFUND_REQUIRED" &&
    Boolean(providerRc?.trim()) &&
    !manualFulfilled;

  if (!allowedRetry) {
    return null;
  }

  async function retryOrder(approveOverThreshold = false) {
    if (loading && !approveOverThreshold) return;
    const confirmed = window.confirm(
      `Pulihkan order ${invoice} (RC ${providerRc})? Pastikan transaksi sebelumnya sudah dipastikan gagal. ${maxPrice.trim() ? `max_price yang akan dipakai: Rp${Number(maxPrice).toLocaleString("id-ID")}.` : "Tidak ada override max_price."} RC70 hanya akan dicek ulang dengan Ref ID yang sama.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage("Permintaan retry sedang dikirim. Tunggu hasilnya dan jangan klik ulang.");
    setDiagnostics("");

    try {
      const response = await fetch("/api/digiflazz/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoice, ...(maxPrice.trim() ? { maxPrice: Number(maxPrice) } : {}), ...(approveOverThreshold ? { approveOverThreshold: true } : {}) }),
      });

      const responseText = await response.text();
      let result: Record<string, any>;
      try {
        result = JSON.parse(responseText) as Record<string, any>;
      } catch {
        throw new Error(`Server mengembalikan respons yang tidak terbaca (HTTP ${response.status}). Buka Vercel Logs untuk pemeriksaan; jangan retry lagi dulu.`);
      }

      if (!response.ok || !result.success) {
        if (result.requiresApproval) {
          const accepted = window.confirm(`${result.message}\\n\\nInvoice: ${result.invoice}\\nPembayaran pelanggan: Rp${Number(result.customerTotal).toLocaleString("id-ID")}\\nmax_price: Rp${Number(result.maxPrice).toLocaleString("id-ID")}\\nPerkiraan subsidi: Rp${Number(result.estimatedSubsidy).toLocaleString("id-ID")}\\nBatas tanpa persetujuan: Rp${Number(result.subsidyLimit).toLocaleString("id-ID")}\\n\\nSetujui dan lanjutkan retry?`);
          if (accepted) { await retryOrder(true); return; }
        }
        setMessage(result.message || "Retry gagal dijalankan.");
        return;
      }

      setMessage(
        `Hasil: ${result.latestProviderStatus || result.providerStatus || "diproses"} · RC ${result.latestProviderRc || result.rc || "-"} · Ref ID ${result.refId || "-"} · ${result.providerMessage || result.message || ""}`,
      );
      if (result.providerResponse) {
        setDiagnostics(JSON.stringify(result.providerResponse, null, 2));
      }
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Permintaan retry gagal dikirim. Periksa status invoice sebelum mencoba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex max-w-[260px] flex-col gap-1 text-[10px] text-slate-300">
        max_price Digiflazz (opsional, Rp)
        <input type="number" min="1" step="1" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Isi sesuai harga buyer Digiflazz" className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs text-white outline-none focus:border-amber-400" />
        <span className="text-slate-500">Subsidi sampai Rp25.000 berjalan otomatis; di atas itu perlu persetujuan admin.</span>
      </label>
      <button
        type="button"
        onClick={() => retryOrder(false)}
        disabled={loading}
        className="inline-flex h-8 items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/10 px-3 text-[10px] font-bold text-amber-200 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Hit Ulang Digiflazz"}
      </button>
      {message && (
        <p role="status" className="max-w-[260px] break-words text-[10px] leading-4 text-slate-300">
          {message}
        </p>
      )}
      {diagnostics && (
        <div className="max-w-[300px]">
          <p className="mb-1 text-[10px] font-bold text-amber-200">Respons JSON provider</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded border border-slate-700 bg-slate-950 p-2 text-[10px] leading-4 text-slate-200">{diagnostics}</pre>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(diagnostics);
              setMessage("JSON respons provider disalin. Periksa dan samarkan data sensitif sebelum dikirim ke CS.");
            }}
            className="mt-1 rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-200"
          >
            Salin JSON
          </button>
        </div>
      )}
    </div>
  );
}
