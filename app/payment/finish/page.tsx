import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PaymentStatusClient from "./PaymentStatusClient";

type PageProps = {
  searchParams: Promise<{
    order_id?: string;
    status_code?: string;
    transaction_status?: string;
  }>;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function paymentMethodName(value?: string | null) {
  const methods: Record<string, string> = {
    qris: "QRIS",
    other_qris: "QRIS",

    gopay: "GoPay",
    dana: "DANA",
    ovo: "OVO",
    shopeepay: "ShopeePay",

    bca_va: "BCA Virtual Account",
    bni_va: "BNI Virtual Account",
    bri_va: "BRI Virtual Account",
    permata_va: "Permata Virtual Account",

    mandiri_va: "Mandiri Virtual Account",
    echannel: "Mandiri Virtual Account",

    bank_transfer: "Virtual Account",

    credit_card: "Kartu Kredit / Debit",
  };

  if (!value) {
    return "-";
  }

  return methods[value] ?? value;
}

export default async function PaymentFinishPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const invoice = params.order_id ?? "";

  if (!invoice) {
    return (
      <main className="min-h-screen bg-[#030712] px-4 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl">
              !
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Pesanan Tidak Ditemukan
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Nomor invoice tidak ditemukan pada URL pembayaran.
            </p>

            <Link
              href="/topup/free-fire"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold transition hover:bg-blue-500"
            >
              Kembali ke Top Up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const order = await prisma.order.findUnique({
    where: {
      invoice,
    },

    include: {
      product: true,
      payment: true,
    },
  });

  if (!order) {
    return (
      <main className="min-h-screen bg-[#030712] px-4 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl">
              !
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Invoice Tidak Ditemukan
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Pesanan dengan invoice tersebut tidak ditemukan.
            </p>

            <Link
              href="/topup/free-fire"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold transition hover:bg-blue-500"
            >
              Kembali ke Top Up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const paymentPaid =
    order.paymentStatus === "PAID";

  const paymentFailed =
    order.paymentStatus === "FAILED" ||
    order.paymentStatus === "EXPIRED" ||
    order.paymentStatus === "CANCELLED";

  const paymentPending =
    !paymentPaid && !paymentFailed;

  const paymentCreatedAt =
    order.payment?.createdAt ?? order.createdAt;

  const expiresAt =
    paymentCreatedAt.getTime() +
    60 * 60 * 1000;

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        {/* BRAND */}
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-black shadow-lg shadow-blue-600/20">
            7A
          </div>

          <div>
            <p className="font-black">
              7 April Store
            </p>

            <p className="text-xs text-slate-500">
              Gaming Marketplace
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* LEFT SIDE */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center">
              {paymentPaid ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl text-emerald-400">
                    ✓
                  </div>

                  <h1 className="mt-4 text-xl font-black">
                    Pembayaran Berhasil
                  </h1>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Pembayaran telah diterima oleh sistem.
                  </p>
                </>
              ) : paymentFailed ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl text-red-400">
                    ×
                  </div>

                  <h1 className="mt-4 text-xl font-black">
                    Pembayaran Gagal
                  </h1>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Transaksi tidak dapat diselesaikan.
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 text-3xl">
                    ⏳
                  </div>

                  <h1 className="mt-4 text-xl font-black">
                    Menunggu Pembayaran
                  </h1>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Jika kamu sudah melakukan pembayaran,
                    tunggu beberapa saat hingga status diperbarui.
                  </p>
                </>
              )}

              <PaymentStatusClient
                invoice={order.invoice}
                expiresAt={expiresAt}
                paymentPending={paymentPending}
              />
            </div>

            {/* STATUS */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Status
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Pembayaran
                </span>

                {paymentPaid ? (
                  <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                    PAID
                  </span>
                ) : paymentFailed ? (
                  <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400">
                    {order.paymentStatus}
                  </span>
                ) : (
                  <span className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-400">
                    PENDING
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-slate-400">
                  Top Up
                </span>

                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">
                  {order.providerStatus}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
              {/* TOP INFORMATION */}
              <div className="grid gap-5 border-b border-white/10 p-5 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Tanggal Pembelian
                  </p>

                  <p className="mt-2 text-xs font-semibold text-white">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Nomor Pesanan
                  </p>

                  <p className="mt-2 break-all text-xs font-bold text-blue-400">
                    {order.invoice}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Sistem Pembayaran
                  </p>

                  <p className="mt-2 text-xs font-semibold text-white">
                    {paymentMethodName(
                      order.payment?.paymentType
                    )}
                  </p>
                </div>
              </div>

              {/* PRODUCT */}
              <div className="flex items-center gap-4 border-b border-white/10 p-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl">
                  💎
                </div>

                <div>
                  <h2 className="text-lg font-black">
                    Free Fire
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Garena
                  </p>
                </div>
              </div>

              {/* DETAIL */}
              <div className="p-5">
                <h3 className="text-sm font-bold">
                  Detail
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-5">
                    <span className="text-sm text-slate-400">
                      Item
                    </span>

                    <span className="text-right text-sm font-semibold">
                      {order.product.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-5">
                    <span className="text-sm text-slate-400">
                      User ID
                    </span>

                    <span className="text-right text-sm font-semibold">
                      {order.uid}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-5">
                    <span className="text-sm text-slate-400">
                      WhatsApp
                    </span>

                    <span className="text-right text-sm font-semibold">
                      {order.whatsapp}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-5">
                    <span className="text-sm text-slate-400">
                      Metode Pembayaran
                    </span>

                    <span className="text-right text-sm font-semibold">
                      {paymentMethodName(
                        order.payment?.paymentType
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t pt-5">
  <div className="flex items-center justify-between gap-5">
    <span className="text-sm text-slate-400">
      Harga Produk
    </span>

    <span className="text-sm font-semibold">
      {formatRupiah(order.subtotal ?? order.total)}
    </span>
  </div>

  {(order.discountAmount ?? 0) > 0 && (
    <div className="flex items-center justify-between gap-5">
      <span className="text-sm text-emerald-400">
        Diskon Promo
      </span>

      <span className="text-sm font-semibold text-emerald-400">
        -{formatRupiah(order.discountAmount ?? 0)}
      </span>
    </div>
  )}

  {(order.discountAmount ?? 0) > 0 && (
    <div className="flex items-center justify-between gap-5">
      <span className="text-sm text-slate-400">
        Harga Setelah Diskon
      </span>

      <span className="text-sm font-semibold">
        {formatRupiah(order.total)}
      </span>
    </div>
  )}

  <div className="flex items-center justify-between gap-5">
    <span className="text-sm text-slate-400">
      Biaya Pembayaran
    </span>

    <span className="text-sm font-semibold">
      {formatRupiah(
        Math.max(
          (order.payment?.grossAmount ?? order.total) - order.total,
          0
        )
      )}
    </span>
  </div>

  <div className="flex items-center justify-between gap-5 border-t border-white/10 pt-4">
    <span className="text-sm font-bold">
      Total Pembayaran
    </span>

    <span className="text-xl font-black text-blue-400">
      {formatRupiah(
        order.payment?.grossAmount ?? order.total
      )}
    </span>
  </div>
</div>
              </div>
            </div>

            {/* PAYMENT PENDING */}
            {paymentPending && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-xs leading-5 text-yellow-200">
                  Status pembayaran diperbarui secara otomatis
                  setelah notifikasi pembayaran diterima oleh
                  server 7 April Store.
                </p>
              </div>
            )}

            {/* PAYMENT PAID */}
            {paymentPaid && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="font-bold text-emerald-400">
                  ✓ Pembayaran sudah diterima
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Pesanan akan diproses sesuai status provider.
                </p>
              </div>
            )}

            {/* BUTTONS */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/order/${encodeURIComponent(
                  order.invoice
                )}`}
                className="flex h-12 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold transition hover:bg-blue-500"
              >
                Lihat Detail Pesanan
              </Link>

              <Link
                href="/topup/free-fire"
                className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-slate-300 transition hover:bg-white/10"
              >
                Top Up Lagi
              </Link>
            </div>

            {/* HELP */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="font-bold">
                Butuh bantuan?
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Simpan nomor invoice untuk mempermudah pengecekan
                transaksi jika kamu membutuhkan bantuan.
              </p>

              <div className="mt-4 rounded-xl bg-[#060b16] p-3">
                <p className="break-all text-xs font-bold text-blue-400">
                  {order.invoice}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}