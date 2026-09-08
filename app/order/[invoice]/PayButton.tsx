"use client";

import { useState } from "react";

type PayButtonProps = {
  invoice: string;
};

export default function PayButton({
  invoice,
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handlePayment() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/midtrans/create",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            invoice,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal membuat pembayaran."
        );
      }

      if (!data.redirectUrl) {
        throw new Error(
          "URL pembayaran tidak ditemukan."
        );
      }

      /*
       * Arahkan pelanggan ke halaman
       * pembayaran resmi Midtrans.
       */
      window.location.href = data.redirectUrl;
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Terjadi kesalahan saat membuat pembayaran."
        );
      }

      setLoading(false);
    }
  }

  return (
    <>
      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className={[
          "mt-6 h-12 w-full rounded-xl font-bold transition",
          loading
            ? "cursor-not-allowed bg-blue-600/40 text-white/60"
            : "bg-blue-600 text-white hover:bg-blue-500",
        ].join(" ")}
      >
        {loading
          ? "Membuka Pembayaran..."
          : "Bayar Sekarang"}
      </button>

      <p className="mt-3 text-center text-xs text-slate-500">
        Pembayaran diproses melalui Midtrans.
      </p>
    </>
  );
}