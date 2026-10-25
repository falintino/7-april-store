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
        label: "GAGAL - REFUND AKAN DIAJUKAN",
        className:
          "border-red-500/30 bg-red-500/10 text-red-400",
      };

    case "REFUND_REQUIRED":
      return {
        label: "REFUND DIPERSIAPKAN",
        className:
          "border-orange-500/30 bg-orange-500/10 text-orange-400",
      };

    case "REFUND_PROCESSING":
      return {
        label: "REFUND SEDANG DIPROSES",
        className:
          "border-orange-500/30 bg-orange-500/10 text-orange-400",
      };

    case "REFUND_PENDING":
      return {
        label: "REFUND MENUNGGU KONFIRMASI",
        className:
          "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
      };

    case "REFUNDED":
      return {
        label: "DANA SUDAH DIKEMBALIKAN",
        className:
          "border-green-500/30 bg-green-500/10 text-green-400",
      };

    case "PARTIAL_REFUND":
      return {
        label: "SEBAGIAN DANA DIKEMBALIKAN",
        className:
          "border-green-500/30 bg-green-500/10 text-green-400",
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

  // Pesanan lama mungkin dibuat sebelum nickname disimpan. Coba pulihkan
  // nickname melalui endpoint lookup yang sama, lalu simpan sebagai snapshot.
  let playerNickname = order.playerNickname;
  const normalizedGame = order.product.game
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!playerNickname && normalizedGame === "free fire") {
    try {
      const lookupUrl = new URL(
        "/api/free-fire/lookup",
        "https://store.falintino.com",
      );
      lookupUrl.searchParams.set("uid", order.uid);

      const lookupResponse = await fetch(lookupUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(9000),
      });

      if (lookupResponse.ok) {
        const lookup = await lookupResponse.json();
        const foundUid = String(lookup.uid ?? "");
        const foundNickname =
          typeof lookup.nickname === "string"
            ? lookup.nickname.trim().slice(0, 80)
            : "";

        if (lookup.ok === true && foundUid === order.uid && foundNickname) {
          const updatedOrder = await prisma.order.update({
            where: { invoice },
            data: { playerNickname: foundNickname },
            select: { playerNickname: true },
          });
          playerNickname = updatedOrder.playerNickname;
        }
      }
    } catch {
      // Jangan gagalkan invoice jika layanan lookup sedang tidak tersedia.
    }
  }

  const paymentPending =
    order.paymentStatus === "PENDING";

  const paymentPaid =
    order.paymentStatus === "PAID";

  const manuallyFulfilled = order.providerMessage?.startsWith("[DIPENUHI_MANUAL]") ?? false;

  const providerSuccess =
    order.providerStatus === "SUCCESS" || manuallyFulfilled;

  const providerFailed =
    order.providerStatus === "FAILED" && !manuallyFulfilled;

  const providerProcessing =
    order.providerStatus ===
    "PROCESSING";

  const providerPending =
    order.providerStatus === "PENDING";

  const providerStatus = manuallyFulfilled
    ? {
        label: "BERHASIL (DIPENUHI MANUAL)",
        className: "border-green-500/30 bg-green-500/10 text-green-400",
      }
    : getProviderStatusConfig(order.providerStatus);

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
          : order.total;

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-12 text-white">
      <OrderAutoRefresh
        paymentStatus={order.paymentStatus}
        providerStatus={manuallyFulfilled ? "SUCCESS" : order.providerStatus}
      />

      <SaveOrderHistory
        invoice={order.invoice}
        productName={order.product.name}
        total={
          finalPaymentAmount ??
          order.total
        }
        paymentStatus={order.paymentStatus}
        providerStatus={manuallyFulfilled ? "SUCCESS" : order.providerStatus}
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
                {order.product.game.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ") === "mobile legends"
                  ? "User ID (Zone ID)"
                  : order.product.game.trim().toLowerCase() === "roblox"
                    ? "Username Roblox"
                    : "UID Free Fire"}
              </p>

              <p className="mt-2 break-all font-semibold text-white">
                {order.uid}
              </p>
            </div>

            {order.product.game.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ") === "free fire" && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Nama Akun Free Fire
                </p>

                <p className="mt-2 font-semibold text-white">
                  {playerNickname || "Belum tersedia"}
                </p>
              </div>
            )}

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
                ) : paymentPaid || hasRecordedPaymentFee ? (
                  <p className="font-bold text-white">
                    {formatRupiah(
                      paymentFee
                    )}
                  </p>
                ) : (
                  <p className="font-bold text-white">
                    Rp0
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
                        Tidak ada biaya metode pembayaran tambahan
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
                      Total pesanan
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
              melanjutkan pembayaran QRIS melalui
              Midtrans.
            </p>

            <PayButton
              invoice={
                order.invoice
              }
            />
          </div>
        )}

        {paymentPaid &&
          (providerPending || providerProcessing) && (
            <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
              <p className="text-lg font-bold text-yellow-400">
                Pembayaran Diterima — Mohon Tunggu
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Diamond murah terkadang masuk cepat, tetapi terkadang membutuhkan waktu lebih lama karena proses dari penyedia. Tunggu sekitar 3–5 menit dan biarkan halaman ini memperbarui status secara otomatis.
              </p>
              <div className="mt-4 rounded-xl border border-yellow-400/20 bg-black/20 p-4 text-sm leading-6 text-slate-300">
                <p className="font-bold text-white">Penting: Diamond mungkin sudah masuk walaupun status masih PENDING.</p>
                Periksa saldo Diamond di game dan muat ulang game jika perlu. Jika setelah 3–5 menit Diamond belum masuk atau status tetap tidak berubah, hubungi bantuan dengan menyertakan nomor invoice ini. Jangan membuat pesanan atau pembayaran kedua.
              </div>
              <a href={`https://wa.me/6285960237306?text=${encodeURIComponent(`Halo admin 7 April Store, mohon bantu cek pesanan ${order.invoice}. Pembayaran sudah berhasil, tetapi status top up masih ${order.providerStatus}. UID: ${order.uid}.`)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
                Hubungi Bantuan WhatsApp
              </a>
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
                {manuallyFulfilled
                  ? "Admin telah mengonfirmasi bahwa pesanan dipenuhi secara manual. Jika Diamond belum terlihat, periksa UID dan saldo di game, lalu hubungi bantuan dengan menyertakan invoice ini."
                  : "Pesanan berhasil diproses oleh provider. Namun, jika Diamond belum terlihat, periksa UID dan saldo di game, lalu muat ulang game. Status berhasil dari provider tidak selalu berarti Diamond langsung terlihat di layar."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/topup/free-fire" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
                  Top Up Lagi
                </Link>
                <a href={`https://wa.me/6285960237306?text=${encodeURIComponent(`Halo admin 7 April Store, saya ingin memberikan ulasan untuk pesanan ${order.invoice}.`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/5">
                  Beri Ulasan
                </a>
              </div>

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
                Pembayaran sudah diterima, tetapi provider melaporkan kegagalan. Jangan membayar ulang dan jangan membuat pesanan kedua. Hubungi bantuan agar admin memeriksa apakah pesanan bisa diproses kembali atau perlu penanganan refund. Status ini bukan berarti dana sudah dikembalikan.
              </p>
              <a href={`https://wa.me/6285960237306?text=${encodeURIComponent(`Halo admin 7 April Store, pembayaran pesanan ${order.invoice} sudah berhasil tetapi status top up ${order.providerStatus}. Mohon bantu periksa. UID: ${order.uid}.`)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
                Laporkan Masalah Pembayaran
              </a>

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

        {paymentPaid && !manuallyFulfilled && ["REFUND_REQUIRED", "REFUND_PROCESSING", "REFUND_PENDING", "PARTIAL_REFUND"].includes(order.providerStatus) && (
          <div className="mt-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6">
            <h2 className="text-lg font-bold text-orange-300">Pembayaran berhasil, tetapi pesanan perlu bantuan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Jangan bayar lagi. Status ini belum membuktikan refund sudah selesai. Hubungi admin untuk memeriksa transaksi dan langkah berikutnya.</p>
            <a href={`https://wa.me/6285960237306?text=${encodeURIComponent(`Halo admin 7 April Store, saya sudah membayar invoice ${order.invoice}, tetapi status top up ${order.providerStatus}. Mohon bantu periksa. UID: ${order.uid}.`)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500">Laporkan Masalah Pembayaran</a>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-green-500/20 bg-slate-900/60 p-5">
          <h2 className="font-bold text-white">Cari Kode Promo? Cek Saluran WhatsApp 7 April FF!</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Kode promo dan informasi promo tertentu dibagikan melalui saluran WhatsApp resmi kami. Gabung supaya tidak ketinggalan promo berikutnya.</p>
          <a href="https://whatsapp.com/channel/0029VbByfE60VycAQEP6Tz1b" target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-300 transition hover:bg-green-500/20">Cari Kode Promo di Saluran WA</a>
        </div>

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
