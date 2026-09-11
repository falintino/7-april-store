"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type OrderAutoRefreshProps = {
  paymentStatus: string;
  providerStatus: string;
};

export default function OrderAutoRefresh({
  paymentStatus,
  providerStatus,
}: OrderAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const paymentFinished =
      paymentStatus === "PAID" ||
      paymentStatus === "FAILED" ||
      paymentStatus === "EXPIRED" ||
      paymentStatus === "CANCELLED" ||
      paymentStatus === "REFUNDED" ||
      paymentStatus === "PARTIAL_REFUND";

    const providerFinished =
      providerStatus === "SUCCESS" ||
      providerStatus === "REFUNDED" ||
      providerStatus === "PARTIAL_REFUND";

    /*
     * Kalau pembayaran dan top up sudah final,
     * tidak perlu refresh lagi.
     */
    if (
      paymentFinished &&
      providerFinished
    ) {
      return;
    }

    /*
     * Refresh halaman setiap 5 detik.
     * router.refresh() mengambil data terbaru
     * dari server tanpa reload penuh browser.
     */
    const interval =
      window.setInterval(() => {
        router.refresh();
      }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    paymentStatus,
    providerStatus,
    router,
  ]);

  return null;
}