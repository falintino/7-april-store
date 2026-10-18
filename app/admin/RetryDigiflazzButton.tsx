"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  invoice: string;
  providerStatus: string;
  providerRc: string | null;
};

export default function RetryDigiflazzButton({
  invoice,
  providerStatus,
  providerRc,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState("");

  const allowedRetry =
    providerStatus === "REFUND_REQUIRED" &&
    ["02", "41", "44", "45", "69"].includes(providerRc ?? "");

  if (!allowedRetry) {
    return null;
  }

  async function retryOrder() {
    const confirmed = window.confirm(
      `Hit ulang transaksi Digiflazz untuk invoice ${invoice}? Pastikan laporan kegagalan sudah dikonfirmasi, seller sudah diperbaiki bila perlu, harga sesuai batas, dan saldo Digiflazz cukup. Retry akan memakai Ref ID baru agar tidak sekadar mengecek transaksi lama.`,
    );

    if (!confirmed || loading) return;

    setLoading(true);
    setMessage("Permintaan retry sedang dikirim. Tunggu hasilnya dan jangan klik ulang.");
    setDiagnostics("");

    try {
      const response = await fetch("/api/digiflazz/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoice }),
      });

      const responseText = await response.text();
      let result: Record<string, any>;
      try {
        result = JSON.parse(responseText) as Record<string, any>;
      } catch {
        throw new Error(`Server mengembalikan respons yang tidak terbaca (HTTP ${response.status}). Buka Vercel Logs untuk pemeriksaan; jangan retry lagi dulu.`);
      }

      if (!response.ok || !result.success) {
        setMessage(
          result.message || "Retry gagal dijalankan.",
        );
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
      <button
        type="button"
        onClick={retryOrder}
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
