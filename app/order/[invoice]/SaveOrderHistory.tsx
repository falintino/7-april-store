"use client";

import { useEffect } from "react";

type SaveOrderHistoryProps = {
  invoice: string;
  productName: string;
  total: number;
  paymentStatus: string;
  providerStatus: string;
  createdAt: string;
};

type SavedOrder = {
  invoice: string;
  productName: string;
  total: number;
  paymentStatus: string;
  providerStatus: string;
  createdAt: string;
};

const STORAGE_KEY =
  "7aprilstore_order_history";

const MAX_SAVED_ORDERS = 10;
const HISTORY_MAX_AGE_MS =
  24 * 60 * 60 * 1000;

export default function SaveOrderHistory({
  invoice,
  productName,
  total,
  paymentStatus,
  providerStatus,
  createdAt,
}: SaveOrderHistoryProps) {
  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      let orders: SavedOrder[] = [];

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          orders = parsed;
        }
      }

      const now = Date.now();

      /*
       * Simpan hanya riwayat yang belum berumur
       * 24 jam. Ini juga membersihkan data lama
       * ketika pelanggan membuka invoice baru.
       */
      const recentOrders =
        orders.filter((order) => {
          if (
            !order ||
            typeof order.createdAt !== "string"
          ) {
            return false;
          }

          const timestamp = new Date(
            order.createdAt
          ).getTime();

          return (
            Number.isFinite(timestamp) &&
            timestamp <= now &&
            now - timestamp < HISTORY_MAX_AGE_MS
          );
        });

      /*
       * Hapus invoice yang sama kalau sebelumnya
       * sudah tersimpan, lalu masukkan data terbaru.
       */
      const updatedOrders = [
        {
          invoice,
          productName,
          total,
          paymentStatus,
          providerStatus,
          createdAt,
        },
        ...recentOrders.filter(
          (order) =>
            order.invoice !== invoice
        ),
      ].slice(
        0,
        MAX_SAVED_ORDERS
      );

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          updatedOrders
        )
      );
    } catch (error) {
      console.error(
        "Gagal menyimpan riwayat pesanan:",
        error
      );
    }
  }, [
    invoice,
    productName,
    total,
    paymentStatus,
    providerStatus,
    createdAt,
  ]);

  return null;
}