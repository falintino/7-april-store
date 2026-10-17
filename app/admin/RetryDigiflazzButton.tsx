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

  const allowedRetry =
    providerStatus === "REFUND_REQUIRED" &&
    (
      providerRc === "44" ||
      (invoice === "7A-20261017-179905" && (providerRc === "69" || providerRc === "02"))
    );

  if (!allowedRetry) {
    return null;
  }

  async function retryOrder() {
    const confirmed = window.confirm(
      `Hit ulang transaksi Digiflazz untuk invoice ${invoice}? Pastikan seller sudah benar, harga seller saat ini tidak melebihi batas harga pesanan, dan saldo Digiflazz cukup. Sistem akan menggunakan Ref ID yang sama.`,
    );

    if (!confirmed || loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/digiflazz/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoice }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(
          result.message || "Retry gagal dijalankan.",
        );
        return;
      }

      setMessage(
        `Hasil: ${result.providerStatus || "diproses"} · RC ${result.rc || "-"} · Ref ID ${result.refId || "-"}`,
      );
      router.refresh();
    } catch {
      setMessage(
        "Permintaan retry gagal dikirim. Periksa status invoice sebelum mencoba lagi.",
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
        <p role="status" className="max-w-[220px] break-words text-[10px] leading-4 text-slate-300">
          {message}
        </p>
      )}
    </div>
  );
}
