"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedOrder = {
  invoice: string;
  productName: string;
  total: number;
  paymentStatus: string;
  providerStatus: string;
  createdAt: string;
};

type StatusOrder = {
  invoice: string;
  paymentStatus: string;
  providerStatus: string;
};

type StatusResponse = {
  orders?: StatusOrder[];
};

const STORAGE_KEY =
  "7aprilstore_order_history";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }
  ).format(date);
}

function getStatusClass(
  status: string
) {
  switch (status) {
    case "PAID":
    case "SUCCESS":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "FAILED":
    case "EXPIRED":
    case "CANCELLED":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "PROCESSING":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";

    default:
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
  }
}

export default function RecentOrders() {
  const [orders, setOrders] =
    useState<SavedOrder[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const saved =
          window.localStorage.getItem(
            STORAGE_KEY
          );

        if (!saved) {
          return;
        }

        const parsed =
          JSON.parse(saved);

        if (!Array.isArray(parsed)) {
          return;
        }

        const savedOrders =
          parsed.filter(
            (
              order
            ): order is SavedOrder =>
              order &&
              typeof order.invoice ===
                "string" &&
              typeof order.productName ===
                "string" &&
              typeof order.total ===
                "number" &&
              typeof order.paymentStatus ===
                "string" &&
              typeof order.providerStatus ===
                "string" &&
              typeof order.createdAt ===
                "string"
          );

        if (cancelled) {
          return;
        }

        setOrders(savedOrders);

        if (
          savedOrders.length === 0
        ) {
          return;
        }

        /*
         * Ambil status terbaru dari server.
         */
        const response = await fetch(
          "/api/orders/status",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              invoices:
                savedOrders.map(
                  (order) =>
                    order.invoice
                ),
            }),

            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const data =
          (await response.json()) as StatusResponse;

        if (
          cancelled ||
          !Array.isArray(data.orders)
        ) {
          return;
        }

        /*
         * Cocokkan status terbaru berdasarkan
         * nomor invoice.
         */
        const statusMap = new Map(
          data.orders.map(
            (order) => [
              order.invoice,
              order,
            ]
          )
        );

        const updatedOrders =
          savedOrders.map(
            (order) => {
              const latest =
                statusMap.get(
                  order.invoice
                );

              if (!latest) {
                return order;
              }

              return {
                ...order,
                paymentStatus:
                  latest.paymentStatus,
                providerStatus:
                  latest.providerStatus,
              };
            }
          );

        if (cancelled) {
          return;
        }

        setOrders(updatedOrders);

        /*
         * Simpan status terbaru kembali
         * ke localStorage.
         */
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            updatedOrders
          )
        );
      } catch (error) {
        console.error(
          "Gagal memuat riwayat pesanan:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || orders.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-3xl px-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div>
          <p className="text-sm font-semibold text-blue-400">
            Riwayat perangkat ini
          </p>

          <h2 className="mt-2 text-xl font-black text-white">
            Pesanan Terakhir
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Pesanan yang pernah dibuka di
            browser ini akan muncul di sini.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {orders.map((order) => (
            <div
              key={order.invoice}
              className="rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-white">
                    {order.productName}
                  </p>

                  <p className="mt-1 text-lg font-black text-blue-400">
                    {formatRupiah(
                      order.total
                    )}
                  </p>

                  <p className="mt-2 break-all text-xs text-slate-500">
                    {order.invoice}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {formatDate(
                      order.createdAt
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getStatusClass(
                        order.paymentStatus
                      )}`}
                    >
                      {
                        order.paymentStatus
                      }
                    </span>

                    <span
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getStatusClass(
                        order.providerStatus
                      )}`}
                    >
                      {
                        order.providerStatus
                      }
                    </span>
                  </div>

                  <Link
                    href={`/order/${encodeURIComponent(
                      order.invoice
                    )}`}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    Lihat Pesanan
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Riwayat tersimpan di browser ini.
          Status pembayaran dan top up
          diperbarui dari server saat halaman
          dibuka.
        </p>
      </div>
    </section>
  );
}