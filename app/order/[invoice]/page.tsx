import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import PayButton from "./PayButton";
import OrderAutoRefresh from "./OrderAutoRefresh";
import SaveOrderHistory from "./SaveOrderHistory";

type PageProps = {
  params: Promise<{
    invoice: string;
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
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function getProviderStatusConfig(
  status: string
) {
  switch (status) {
    case "SUCCESS":
      return {
        label: "BERHASIL",
        className:
          "border-green-500/30 bg-green-500/10 text-green-400",
      };

    case "FAILED":
      return {
        label: "GAGAL",
        className:
          "border-red-500/30 bg-red-500/10 text-red-400",
      };

    case "PROCESSING":
      return {
        label: "DIPROSES",
        className:
          "border-blue-500/30 bg-blue-500/10 text-blue-400",
      };

    case "PENDING":
    default:
      return {
        label: "PENDING",
        className:
          "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
      };
  }
}

function paymentMethodName(
  paymentType?: string | null
) {
  switch (paymentType) {
    case "qris":
    case "other_qris":
      return "QRIS";

    case "gopay":
      return "GoPay";

    case "shopeepay":
      return "ShopeePay";

    case "dana":
      return "DANA";

    case "ovo":
      return "OVO";

    case "bca_va":
      return "BCA Virtual Account";

    case "bni_va":
      return "BNI Virtual Account";

    case "bri_va":
      return "BRI Virtual Account";

    case "permata_va":
      return "Permata Virtual Account";

    case "echannel":
      return "Mandiri Bill Payment";

    default:
      return paymentType
        ? paymentType
            .replaceAll("_", " ")
            .toUpperCase()
        : "-";
  }
}

export default async function OrderPage({
  params,
}: PageProps) {
  const { invoice } = await params;

  const order =
    await prisma.order.findUnique({
      where: {
        invoice,
      },

      include: {
        product: true,
        payment: true,
      },
    });

  if (!order) {
    notFound();
  }

  const paymentPending =
    order.paymentStatus === "PENDING";

  const paymentPaid =
    order.paymentStatus === "PAID";

  const providerSuccess =
    order.providerStatus === "SUCCESS";

  const providerFailed =
    order.providerStatus === "FAILED";

  const providerProcessing =
    order.providerStatus ===
    "PROCESSING";

  const providerPending =
    order.providerStatus === "PENDING";

  const providerStatus =
    getProviderStatusConfig(
      order.providerStatus
    );

  const productPrice =
    order.subtotal ?? order.total;

  const discountAmount =
    order.discountAmount ?? 0;

  const hasProductDiscount =
    discountAmount > 0;

  const recordedGrossAmount =
    order.payment?.grossAmount ?? null;

  const paymentFee =
    order.paymentFeeWaived
      ? 0
      : recordedGrossAmount !== null
        ? Math.max(
            recordedGrossAmount -
              order.total,
            0
          )
        : 0;

  const hasRecordedPaymentFee =
    recordedGrossAmount !== null &&
    recordedGrossAmount >
      order.total;

  const finalPaymentAmount =
    order.paymentFeeWaived
      ? order.total
      : paymentPaid
        ? recordedGrossAmount ??
          order.total
        : hasRecordedPaymentFee
          ? recordedGrossAmount
          : null;

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-12 text-white">
      <OrderAutoRefresh
        paymentStatus={order.paymentStatus}
        providerStatus={order.providerStatus}
      />

      <SaveOrderHistory
        invoice={order.invoice}
        productName={order.product.name}
        total={
          finalPaymentAmount ??
          order.total
        }
        paymentStatus={order.paymentStatus}
        providerStatus={order.providerStatus}
        createdAt={order.createdAt.toISOString()}
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            Detail Pesanan
          </span>

          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            Invoice Pesanan
          </h1>

          <p className="mt-3 text-slate-400">
            Simpan nomor invoice ini untuk
            mengecek status transaksi kamu.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
          <div className="border-b border-white/10 p-6">
            <p className="text-sm text-slate-400">
              Nomor Invoice
            </p>

            <p className="mt-2 break-all text-xl font-black text-blue-400">
              {order.invoice}
            </p>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Status Pembayaran
              </p>

              {paymentPaid ? (
                <div className="mt-2 inline-flex rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-bold text-green-400">
                  PAID
                </div>
              ) : (
                <div className="mt-2 inline-flex rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm font-bold text-yellow-400">
                  {
                    order.paymentStatus
                  }
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Status Top Up
              </p>

              <div
                className={`mt-2 inline-flex rounded-lg border px-3 py-2 text-sm font-bold ${providerStatus.className}`}
              >
                {
                  providerStatus.label
                }
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                UID Free Fire
              </p>

              <p className="mt-2 font-semibold text-white">
                {order.uid}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                WhatsApp
              </p>

              <p className="mt-2 font-semibold text-white">
                {order.whatsapp}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Produk
              </p>

              <p className="mt-2 font-semibold text-white">
                {
                  order.product
                    .name
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Metode Pembayaran
              </p>

              <p className="mt-2 font-semibold text-white">
                {paymentMethodName(
                  order.payment
                    ?.paymentType
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Waktu Pesanan
              </p>

              <p className="mt-2 font-semibold text-white">
                {formatDate(
                  order.createdAt
                )}
              </p>
            </div>

            {order.providerRefId && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Ref ID Provider
                </p>

                <p className="mt-2 break-all font-semibold text-slate-300">
                  {
                    order.providerRefId
                  }
                </p>
              </div>
            )}

            {providerSuccess &&
              order.providerSn && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    SN Provider
                  </p>

                  <p className="mt-2 break-all font-semibold text-green-400">
                    {
                      order.providerSn
                    }
                  </p>
                </div>
              )}
          </div>

          <div className="border-t border-white/10 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-black text-white">
                Rincian Pembayaran
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {
                  order.product
                    .name
                }
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-6">
                <p className="text-sm text-slate-400">
                  Harga Produk
                </p>

                <p className="font-bold text-white">
                  {formatRupiah(
                    productPrice
                  )}
                </p>
              </div>

              {hasProductDiscount && (
                <div className="flex items-center justify-between gap-6">
                  <p className="text-sm text-green-400">
                    Diskon Promo
                  </p>

                  <p className="font-bold text-green-400">
                    -
                    {formatRupiah(
                      discountAmount
                    )}
                  </p>
                </div>
              )}

              {hasProductDiscount && (
                <div className="flex items-center justify-between gap-6">
                  <p className="text-sm text-slate-400">
                    Harga Setelah Diskon
                  </p>

                  <p className="font-bold text-white">
                    {formatRupiah(
                      order.total
                    )}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm text-slate-400">
                    Biaya Pembayaran
                  </p>

                  {order.paymentFeeWaived && (
                    <p className="mt-1 text-xs font-medium text-green-400">
                      Promo bebas biaya pembayaran
                    </p>
                  )}
                </div>

                {order.paymentFeeWaived ? (
                  <div className="text-right">
                    <p className="font-bold text-green-400">
                      Rp0
                    </p>
                  </div>
                ) : paymentPaid ||
                  hasRecordedPaymentFee ? (
                  <p className="font-bold text-white">
                    {formatRupiah(
                      paymentFee
                    )}
                  </p>
                ) : (
                  <p className="text-right text-sm text-slate-400">
                    Dihitung saat pembayaran
                  </p>
                )}
              </div>

              <div className="border-t border-dashed border-white/10" />

              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Total Pembayaran
                  </p>

                  {!paymentPaid &&
                    !order.paymentFeeWaived &&
                    !hasRecordedPaymentFee && (
                      <p className="mt-1 text-xs text-slate-500">
                        Harga produk + biaya metode pembayaran
                      </p>
                    )}
                </div>

                {finalPaymentAmount !==
                null ? (
                  <p className="text-2xl font-black text-blue-400">
                    {formatRupiah(
                      finalPaymentAmount
                    )}
                  </p>
                ) : (
                  <div className="text-right">
                    <p className="text-lg font-black text-blue-400">
                      {formatRupiah(
                        order.total
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      + biaya pembayaran
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {paymentPending && (
          <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl">
              💳
            </div>

            <h2 className="mt-4 text-xl font-bold">
              Selesaikan Pembayaran
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Klik tombol di bawah untuk
              melanjutkan pembayaran melalui
              Midtrans Sandbox.
            </p>

            <PayButton
              invoice={
                order.invoice
              }
            />
          </div>
        )}

        {paymentPaid &&
          providerPending && (
            <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
              <p className="text-lg font-bold text-yellow-400">
                Pembayaran Diterima
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Pembayaran sudah berhasil.
                Top up sedang menunggu hasil
                dari provider.
              </p>

              <p className="mt-3 text-xs text-slate-500">
                Status transaksi akan diperbarui
                otomatis di halaman ini.
              </p>
            </div>
          )}

        {paymentPaid &&
          providerProcessing && (
            <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
              <p className="text-lg font-bold text-blue-400">
                Top Up Sedang Diproses
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Pesanan sedang diproses oleh
                provider. Halaman ini akan
                memperbarui status secara otomatis.
              </p>
            </div>
          )}

        {paymentPaid &&
          providerSuccess && (
            <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
              <p className="text-lg font-bold text-green-400">
                ✓ Top Up Berhasil
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Pesanan berhasil diproses oleh
                provider.
              </p>

              {order.providerSn && (
                <div className="mt-4 rounded-xl border border-green-500/20 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    SN
                  </p>

                  <p className="mt-2 break-all font-bold text-green-400">
                    {
                      order.providerSn
                    }
                  </p>
                </div>
              )}
            </div>
          )}

        {paymentPaid &&
          providerFailed && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <p className="text-lg font-bold text-red-400">
                Top Up Gagal
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Pembayaran sudah diterima,
                tetapi provider tidak berhasil
                memproses top up.
              </p>

              {order.providerMessage && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Keterangan Provider
                  </p>

                  <p className="mt-2 text-sm text-red-300">
                    {
                      order.providerMessage
                    }
                  </p>
                </div>
              )}

              <p className="mt-4 text-xs text-slate-500">
                Simpan nomor invoice untuk
                proses pengecekan transaksi.
              </p>
            </div>
          )}

        <div className="mt-6 flex justify-center">
          <Link
            href="/topup/free-fire"
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            ← Kembali ke Top Up Free Fire
          </Link>
        </div>
      </div>
    </main>
  );
}