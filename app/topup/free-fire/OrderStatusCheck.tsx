"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusCheck() {
  const router = useRouter();

  const [invoice, setInvoice] =
    useState("");

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanInvoice =
      invoice.trim();

    if (!cleanInvoice) {
      return;
    }

    router.push(
      `/order/${encodeURIComponent(
        cleanInvoice
      )}`
    );
  }

  return (
    <section
      id="cek-pesanan"
      className="mx-auto mt-10 w-full max-w-3xl scroll-mt-24 px-4"
    >
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div>
          <p className="text-sm font-semibold text-blue-400">
            Sudah punya pesanan?
          </p>

          <h2 className="mt-2 text-xl font-black text-white">
            Cek Status Pesanan
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Masukkan nomor invoice untuk
            melihat status pembayaran dan
            proses top up.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={invoice}
            onChange={(event) =>
              setInvoice(
                event.target.value
              )
            }
            placeholder="Contoh: 7A-20260908-854473"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
          />

          <button
            type="submit"
            disabled={!invoice.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cek Pesanan
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-500">
          Nomor invoice diberikan setelah
          pesanan dibuat.
        </p>
      </div>
    </section>
  );
}