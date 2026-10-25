"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  invoice: string;
  paymentStatus: string;
  providerStatus: string;
  providerMessage: string | null;
};

export default function ManualFulfillmentButton({
  invoice,
  paymentStatus,
  providerStatus,
  providerMessage,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const alreadyMarked = providerMessage?.startsWith("[DIPENUHI_MANUAL]") ?? false;
  const eligible =
    paymentStatus === "PAID" &&
    ["REFUND_REQUIRED", "FAILED"].includes(providerStatus) &&
    !alreadyMarked;

  if (!eligible) {
    return null;
  }

  async function markAsManuallyFulfilled() {
    const confirmed = window.confirm(
      `Tandai invoice ${invoice} sebagai DIPENUHI MANUAL? Lakukan ini hanya jika kamu sudah benar-benar mengirim diamond ke UID pelanggan melalui tempat lain. Tindakan ini tidak mengubah status provider Digiflazz.`,
    );
    if (!confirmed || loading) return;

    setLoading(true);
    setMessage("Menyimpan konfirmasi pemenuhan manual...");
    try {
      const response = await fetch("/api/admin/manual-fulfillment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !result.success) {
        setMessage(result.message || "Gagal menyimpan status.");
        return;
      }
      setMessage(result.message || "Pesanan ditandai dipenuhi manual.");
      router.refresh();
    } catch {
      setMessage("Permintaan gagal. Muat ulang halaman dan periksa status invoice sebelum mencoba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={markAsManuallyFulfilled}
        disabled={loading}
        className="inline-flex min-h-8 items-center justify-center rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-[10px] font-bold text-green-300 transition hover:bg-green-500/20 disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Tandai Dipenuhi Manual"}
      </button>
      {message && (
        <p role="status" className="max-w-[200px] break-words text-[10px] leading-4 text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}
