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

      /*
       * Hapus invoice yang sama kalau
       * sebelumnya sudah pernah disimpan.
       *
       * Setelah itu masukkan data terbaru
       * ke posisi paling atas.
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
        ...orders.filter(
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