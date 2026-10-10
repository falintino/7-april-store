"use client";

import { useEffect, useState } from "react";

export default function PaymentUpdatePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = window.sessionStorage.getItem(
      "payment-update-popup-dismissed"
    );

    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  function closePopup() {
    window.sessionStorage.setItem(
      "payment-update-popup-dismissed",
      "1"
    );
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-update-title"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-400/30 bg-slate-950 shadow-2xl shadow-black/50"
      >
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-2xl">
              ⚠️
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                Informasi Penting
              </p>

              <h2
                id="payment-update-title"
                className="mt-1 text-xl font-black text-white"
              >
                Pembayaran Sedang Diperbarui
              </h2>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <p className="text-sm leading-6 text-slate-300">
            Sistem pembayaran 7 April Store sedang dalam proses pembaruan dan
            aktivasi. Untuk sementara, metode pembayaran dapat belum tersedia.
          </p>

          <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
            <p className="text-xs leading-5 text-blue-100">
              Silakan coba kembali setelah sistem pembayaran aktif. Pesanan
              yang sudah berhasil dibayar tetap diproses sesuai statusnya.
            </p>
          </div>

          <button
            type="button"
            onClick={closePopup}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.99]"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
