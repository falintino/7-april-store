"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  invoice: string;
  expiresAt: number;
  paymentPending: boolean;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function PaymentStatusClient({
  invoice,
  expiresAt,
  paymentPending,
}: Props) {
  const router = useRouter();

  const [now, setNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);

  const remaining = Math.max(
    0,
    expiresAt - now
  );

  const time = useMemo(() => {
    const totalSeconds = Math.floor(
      remaining / 1000
    );

    const hours = Math.floor(
      totalSeconds / 3600
    );

    const minutes = Math.floor(
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

  useEffect(() => {
    if (!paymentPending) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [paymentPending]);

  /*
   * Saat payment masih pending,
   * refresh data server setiap 5 detik.
   * Jika webhook Midtrans sudah mengubah
   * status menjadi PAID, halaman otomatis
   * ikut berubah.
   */
  useEffect(() => {
    if (!paymentPending) {
      return;
    }

    const poll = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => {
      window.clearInterval(poll);
    };
  }, [paymentPending, router]);

  function handleCheckStatus() {
    setChecking(true);

    router.refresh();

    window.setTimeout(() => {
      setChecking(false);
    }, 800);
  }

  if (!paymentPending) {
    return null;
  }

  return (
    <>
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

      <p className="mt-3 break-all text-[10px] text-slate-600">
        Invoice: {invoice}
      </p>
    </>
  );
}