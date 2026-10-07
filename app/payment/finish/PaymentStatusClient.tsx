"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  invoice: string;
  expiresAt: number;
  paymentPending: boolean;
  providerStatus: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const FINAL_PROVIDER_STATUSES = [
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "PARTIAL_REFUND",
];

export default function PaymentStatusClient({
  invoice,
  expiresAt,
  paymentPending,
  providerStatus,
}: Props) {
  const router = useRouter();

  const [now, setNow] = useState(0);
  const [checking, setChecking] = useState(false);

  const providerPending =
    !FINAL_PROVIDER_STATUSES.includes(
      providerStatus
    );

  const shouldRefresh =
    paymentPending ||
    providerPending;

  const remaining = Math.max(
    0,
    now === 0
      ? 0
      : expiresAt - now
  );

  const time = useMemo(() => {
    const totalSeconds = Math.floor(
      remaining / 1000
    );

    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const seconds =
      totalSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
    };
  }, [remaining]);

  /*
   * Countdown hanya diperlukan selama
   * pembayaran masih pending.
   */
  useEffect(() => {
    if (!paymentPending) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setNow(Date.now());
      }, 1000);

    setNow(Date.now());

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [paymentPending]);

  /*
   * =========================================
   * AUTO REFRESH PAYMENT + PROVIDER STATUS
   * =========================================
   *
   * Sebelumnya refresh berhenti setelah
   * pembayaran menjadi PAID.
   *
   * Sekarang:
   *
   * PENDING payment
   *        ↓
   * PAID
   *        ↓
   * provider PENDING
   *        ↓
   * provider SUCCESS / FAILED / REFUNDED
   *
   * Halaman terus refresh sampai provider
   * benar-benar final.
   */
  useEffect(() => {
    if (!shouldRefresh) {
      return;
    }

    const poll =
      window.setInterval(() => {
        router.refresh();
      }, 3000);

    return () => {
      window.clearInterval(
        poll
      );
    };
  }, [
    shouldRefresh,
    router,
  ]);

  function handleCheckStatus() {
    setChecking(true);

    router.refresh();

    window.setTimeout(() => {
      setChecking(false);
    }, 800);
  }

  /*
   * Kalau pembayaran sudah selesai dan
   * provider juga sudah final, tidak perlu
   * menampilkan countdown/check button.
   */
  if (
    !paymentPending &&
    !providerPending
  ) {
    return null;
  }

  return (
    <>
      {paymentPending && (
        <div className="mt-6">
          <p className="text-xs text-slate-500">
            Batas waktu pembayaran
          </p>

          <div className="mt-4 flex items-center justify-center gap-4">
            <div>
              <div className="flex h-12 min-w-14 items-center justify-center rounded-xl bg-[#060b16] text-lg font-black">
                {pad(time.hours)}
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                Jam
              </p>
            </div>

            <span className="mb-5 font-black text-slate-600">
              :
            </span>

            <div>
              <div className="flex h-12 min-w-14 items-center justify-center rounded-xl bg-[#060b16] text-lg font-black">
                {pad(time.minutes)}
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                Menit
              </p>
            </div>

            <span className="mb-5 font-black text-slate-600">
              :
            </span>

            <div>
              <div className="flex h-12 min-w-14 items-center justify-center rounded-xl bg-[#060b16] text-lg font-black text-blue-400">
                {pad(time.seconds)}
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                Detik
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentPending && (
        <button
          type="button"
          disabled={checking}
          onClick={handleCheckStatus}
          className="mt-6 h-11 w-full rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {checking
            ? "Mengecek Status..."
            : "Cek Status Pembayaran"}
        </button>
      )}

      {paymentPending && (
        <p className="mt-3 break-all text-[10px] text-slate-600">
          Invoice: {invoice}
        </p>
      )}

      {!paymentPending &&
        providerPending && (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-left">
            <p className="text-xs font-bold text-blue-300">
              Pesanan sedang diproses
            </p>

            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              Pembayaran sudah diterima.
              Sistem sedang menunggu
              konfirmasi top up dari provider.
              Halaman akan diperbarui
              otomatis.
            </p>
          </div>
        )}
    </>
  );
}