"use client";

import { useEffect, useRef, useState } from "react";
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

  const previousPaymentStatus =
    useRef(paymentStatus);

  const previousProviderStatus =
    useRef(providerStatus);

  const [notification, setNotification] =
    useState<string | null>(null);

  const [notificationType, setNotificationType] =
    useState<"success" | "info" | "error">(
      "info"
    );

  /*
   * =========================================
   * CEK PERUBAHAN STATUS
   * =========================================
   */

  useEffect(() => {
    const previousPayment =
      previousPaymentStatus.current;

    const previousProvider =
      previousProviderStatus.current;

    /*
     * Pembayaran berhasil diterima.
     */
    if (
      paymentStatus === "PAID" &&
      previousPayment !== "PAID"
    ) {
      setNotification(
        "Pembayaran berhasil diterima. Pesanan sedang diproses."
      );

      setNotificationType("info");
    }

    /*
     * Top up berhasil.
     */
    if (
      providerStatus === "SUCCESS" &&
      previousProvider !== "SUCCESS"
    ) {
      setNotification(
        "Top Up berhasil! Produk sudah berhasil dikirim ke akun kamu."
      );

      setNotificationType("success");

      /*
       * Browser notification jika user
       * sebelumnya sudah memberikan izin.
       */
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(
          "7 April Store",
          {
            body:
              "Top Up berhasil! Produk sudah berhasil dikirim ke akun kamu.",
          }
        );
      }
    }

    /*
     * Top up gagal.
     */
    if (
      [
        "FAILED",
        "REFUND_REQUIRED",
        "REFUND_PENDING",
        "REFUND_PROCESSING",
      ].includes(providerStatus) &&
      ![
        "FAILED",
        "REFUND_REQUIRED",
        "REFUND_PENDING",
        "REFUND_PROCESSING",
      ].includes(previousProvider)
    ) {
      setNotification(
        "Pesanan tidak berhasil diproses. Silakan cek detail pesanan."
      );

      setNotificationType("error");

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(
          "7 April Store",
          {
            body:
              "Pesanan tidak berhasil diproses. Silakan cek detail pesanan.",
          }
        );
      }
    }

    previousPaymentStatus.current =
      paymentStatus;

    previousProviderStatus.current =
      providerStatus;

    /*
     * Hilangkan toast setelah 6 detik.
     */
    if (notification) {
      const timeout =
        window.setTimeout(() => {
          setNotification(null);
        }, 6000);

      return () => {
        window.clearTimeout(timeout);
      };
    }
  }, [
    paymentStatus,
    providerStatus,
    notification,
  ]);

  /*
   * =========================================
   * AUTO REFRESH
   * =========================================
   *
   * Cek perubahan status setiap 2 detik.
   */
  useEffect(() => {
    const paymentFinished =
      paymentStatus === "PAID" ||
      paymentStatus === "FAILED" ||
      paymentStatus === "EXPIRED" ||
      paymentStatus === "CANCELLED" ||
      paymentStatus === "REFUNDED" ||
      paymentStatus === "PARTIAL_REFUND";

    const providerFinished =
      [
        "SUCCESS",
        "REFUNDED",
        "PARTIAL_REFUND",
        "REFUND_PENDING",
        "REFUND_PROCESSING",
      ].includes(providerStatus);

    /*
     * Kalau sudah final, tidak perlu
     * refresh lagi.
     */
    if (
      paymentFinished &&
      providerFinished
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        router.refresh();
      }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    paymentStatus,
    providerStatus,
    router,
  ]);

  if (!notification) {
    return null;
  }

  const notificationClass =
    notificationType === "success"
      ? "border-green-500/30 bg-green-500/10 text-green-300"
      : notificationType === "error"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-blue-500/30 bg-blue-500/10 text-blue-300";

  const icon =
    notificationType === "success"
      ? "✓"
      : notificationType === "error"
        ? "!"
        : "i";

  return (
    <div className="fixed right-5 top-5 z-[9999] max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${notificationClass}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 font-black">
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold">
            {notificationType === "success"
              ? "Top Up Berhasil"
              : notificationType === "error"
                ? "Pesanan Gagal"
                : "Status Pesanan"}
          </p>

          <p className="mt-1 text-xs leading-5 opacity-90">
            {notification}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setNotification(null)
          }
          className="ml-auto text-lg opacity-60 transition hover:opacity-100"
          aria-label="Tutup notifikasi"
        >
          ×
        </button>
      </div>
    </div>
  );
}