"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  popular: boolean;
};

type TopUpClientProps = {
  products: Product[];
};

type PaymentMethod = "qris";

type PaymentOption = {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
};

const paymentGroups: {
  title: string;
  items: PaymentOption[];
}[] = [
  {
    title: "QRIS",

    items: [
      {
        id: "qris",

        name: "QRIS",

        description: "QRIS aman yang diproses melalui Midtrans",

        icon: "QR",
      },
    ],
  },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",

    currency: "IDR",

    minimumFractionDigits: 0,
  }).format(value);
}

export default function TopUpClient({ products }: TopUpClientProps) {
  const [uid, setUid] = useState("");

  const [whatsapp, setWhatsapp] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const [activeCategory, setActiveCategory] = useState<
    "diamond" | "membership"
  >("diamond");

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  /*
   * ================================
   * PRODUK TERPILIH
   * ================================
   */

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === selectedProductId);
  }, [products, selectedProductId]);

  const previewProductPrice = selectedProduct?.price ?? 0;

  /*
   * ================================
   * PAYMENT TERPILIH
   * ================================
   */

  const selectedPayment = useMemo(() => {
    for (const group of paymentGroups) {
      const payment = group.items.find(
        (item) => item.id === selectedPaymentMethod,
      );

      if (payment) {
        return payment;
      }
    }

    return null;
  }, [selectedPaymentMethod]);

  /*
   * ================================
   * PRODUK
   * ================================
   */

  const diamondProducts = useMemo(() => {
    return products
      .filter((product) => !product.sku.startsWith("FF_MEMBERSHIP_"))
      .sort((a, b) => a.price - b.price);
  }, [products]);

  const membershipProducts = useMemo(() => {
    return products
      .filter((product) => product.sku.startsWith("FF_MEMBERSHIP_"))
      .sort((a, b) => a.price - b.price);
  }, [products]);

  const displayedProducts =
    activeCategory === "diamond" ? diamondProducts : membershipProducts;

  /*
   * ================================
   * VALIDASI FORM
   * ================================
   */

  const uidValid = /^\d{6,}$/.test(uid);

  const whatsappValid = /^\d{10,15}$/.test(whatsapp);

  const productValid = Boolean(selectedProduct);

  const paymentValid = Boolean(selectedPaymentMethod);

  const formValid =
    uidValid &&
    whatsappValid &&
    productValid &&
    paymentValid &&
    acceptedTerms &&
    !loading;

  /*
   * ================================
   * INPUT
   * ================================
   */

  function handleUidChange(value: string) {
    setUid(value.replace(/\D/g, ""));

    setErrorMessage("");
  }

  function handleWhatsappChange(value: string) {
    setWhatsapp(value.replace(/\D/g, ""));

    setErrorMessage("");
  }

  /*
   * ================================
   * PILIH PRODUK
   * ================================
   */

  function handleSelectProduct(productId: string) {
    setSelectedProductId(productId);

    setErrorMessage("");
  }

  function handleCategoryChange(category: "diamond" | "membership") {
    setActiveCategory(category);

    setSelectedProductId("");

    setSelectedPaymentMethod(null);

    setErrorMessage("");
  }

  /*
   * ================================
   * KONFIRMASI PESANAN
   * ================================
   */

  async function handleConfirm() {
    if (!formValid || !selectedProduct || !selectedPaymentMethod || loading) {
      return;
    }

    try {
      setLoading(true);

      setErrorMessage("");

      /*
       * ================================
       * STEP 1
       * BUAT ORDER
       * ================================
       *
       * Browser hanya mengirim:
       *
       * UID
       * WhatsApp
       * productId
       *
       * Harga dan modal tidak dikirim.
       */

      const orderResponse = await fetch("/api/orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          uid,

          whatsapp,

          productId: selectedProduct.id,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message || "Pesanan gagal dibuat.");
      }

      const invoice = orderData.order?.invoice;

      if (!invoice) {
        throw new Error("Invoice pesanan tidak ditemukan.");
      }

      /*
       * ================================
       * STEP 2
       * BUAT PEMBAYARAN MIDTRANS
       * ================================
       */

      const paymentResponse = await fetch("/api/midtrans/create", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          invoice,

          paymentMethod: selectedPaymentMethod,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || "Pembayaran gagal dibuat.");
      }

      if (!paymentData.redirectUrl) {
        throw new Error("Link pembayaran tidak ditemukan.");
      }

      /*
       * ================================
       * STEP 3
       * REDIRECT KE HALAMAN PEMBAYARAN
       * ================================
       */

      window.location.href = paymentData.redirectUrl;
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Terjadi kesalahan saat membuat pesanan.");
      }

      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      {/* HERO */}

      <div className="mb-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-600/10 via-slate-900/70 to-slate-900/50">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600/15 text-3xl ring-1 ring-blue-500/20">
              💎
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">
                7 APRIL STORE
              </p>

              <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">
                Top Up Free Fire
              </h1>

              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Pilih nominal dan metode pembayaran favoritmu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs font-semibold text-emerald-400">
              Layanan tersedia
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1 */}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black">
            1
          </div>

          <div>
            <h2 className="font-bold text-white">Masukkan Data Akun</h2>

            <p className="text-xs text-slate-500">Pastikan data akun benar</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">
              UID Free Fire
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={uid}
              disabled={loading}
              onChange={(event) => handleUidChange(event.target.value)}
              placeholder="Contoh: 123456789"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {uid.length > 0 && !uidValid && (
              <p className="mt-2 text-xs text-red-400">UID minimal 6 angka.</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">
              Nomor WhatsApp
            </label>

            <input
              type="tel"
              inputMode="numeric"
              value={whatsapp}
              disabled={loading}
              onChange={(event) => handleWhatsappChange(event.target.value)}
              placeholder="Contoh: 081234567890"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {whatsapp.length > 0 && !whatsappValid && (
              <p className="mt-2 text-xs text-red-400">
                Nomor WhatsApp harus 10–15 angka.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STEP 2 */}

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black">
            2
          </div>

          <div>
            <h2 className="font-bold text-white">Pilih Nominal Top Up</h2>

            <p className="text-xs text-slate-500">
              Pilih produk yang ingin dibeli
            </p>
          </div>
        </div>

        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange("diamond")}
            className={[
              "rounded-xl border px-4 py-2.5 text-sm font-bold transition",

              activeCategory === "diamond"
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-white/10 text-slate-400",
            ].join(" ")}
          >
            💎 Diamond
          </button>

          <button
            type="button"
            onClick={() => handleCategoryChange("membership")}
            className={[
              "rounded-xl border px-4 py-2.5 text-sm font-bold transition",

              activeCategory === "membership"
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-white/10 text-slate-400",
            ].join(" ")}
          >
            🎟 Membership
          </button>
        </div>

        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayedProducts.map((product) => {
              const selected = selectedProductId === product.id;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectProduct(product.id)}
                  className={[
                    "relative min-h-[115px] rounded-xl border p-3 text-left transition",

                    selected
                      ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                      : "border-white/10 bg-[#0a1020] hover:border-blue-500/60",
                  ].join(" ")}
                >
                  {product.popular && (
                    <span className="absolute right-2 top-2 rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-black">
                      POPULER
                    </span>
                  )}

                  <div className="text-lg">
                    {activeCategory === "membership" ? "🎟" : "💎"}
                  </div>

                  <p className="mt-3 text-sm font-bold text-white">
                    {product.name}
                  </p>

                  <p className="mt-1 text-[9px] uppercase text-slate-600">
                    Harga
                  </p>

                  <p className="text-sm font-black text-blue-400">
                    {formatRupiah(product.price)}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-500">
            {activeCategory === "membership"
              ? "Membership belum tersedia."
              : "Diamond belum tersedia."}
          </div>
        )}
      </div>

      {/* STEP 3 PAYMENT */}

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black">
            3
          </div>

          <div>
            <h2 className="font-bold text-white">Pilih Pembayaran</h2>

            <p className="text-xs text-slate-500">Pilih metode pembayaran</p>
          </div>
        </div>

        <div className="space-y-7">
          {paymentGroups.map((group) => (
            <div key={group.title}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-bold text-slate-300">
                  {group.title}
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div
                className={[
                  "grid gap-3",

                  group.items.length === 1
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3",
                ].join(" ")}
              >
                {group.items.map((payment) => {
                  const selected = selectedPaymentMethod === payment.id;

                  return (
                    <button
                      key={payment.id}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setSelectedPaymentMethod(payment.id);

                        setErrorMessage("");
                      }}
                      className={[
                        "flex min-h-[82px] items-center justify-between gap-4 rounded-xl border p-3 text-left transition",

                        selected
                          ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                          : "border-white/10 bg-[#0a1020] hover:border-blue-500/50",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 min-w-12 items-center justify-center rounded-lg bg-white px-2 text-xs font-black text-slate-900">
                          {payment.icon}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-white">
                            {payment.name}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-500">
                            {payment.description}
                          </p>
                        </div>
                      </div>

                      {selected && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 4 */}

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black">
            4
          </div>

          <div>
            <h2 className="font-bold text-white">Konfirmasi Pesanan</h2>

            <p className="text-xs text-slate-500">Periksa kembali pesananmu</p>
          </div>
        </div>

        {/* RINGKASAN */}

        {selectedProduct ? (
          <div className="rounded-xl border border-white/10 bg-[#060b16] p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Produk</p>

                <p className="mt-1 font-bold text-white">
                  {selectedProduct.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Pembayaran</p>

                <p className="mt-1 font-bold text-white">
                  {selectedPayment?.name || "Belum dipilih"}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs text-slate-500">Total pembayaran</p>

                <p className="mt-1 text-xl font-black text-blue-400">
                  {formatRupiah(previewProductPrice)}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs leading-5 text-slate-500">
                Jumlah di atas adalah total yang dikirim ke halaman pembayaran
                QRIS Midtrans.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
            Pilih nominal terlebih dahulu.
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#060b16] p-4 text-xs leading-5 text-slate-300">
          <input
            type="checkbox"
            checked={acceptedTerms}
            disabled={loading}
            onChange={(event) => {
              setAcceptedTerms(event.target.checked);
              setErrorMessage("");
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
          />
          <span>
            Saya telah memeriksa UID dan nominal, serta menyetujui{" "}
            <Link
              href="/syarat-ketentuan"
              target="_blank"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Syarat dan Ketentuan
            </Link>
            ,{" "}
            <Link
              href="/kebijakan-pengiriman"
              target="_blank"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Kebijakan Pengiriman
            </Link>{" "}
            dan{" "}
            <Link
              href="/kebijakan-refund"
              target="_blank"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Kebijakan Refund
            </Link>
            .
          </span>
        </label>

        <button
          type="button"
          disabled={!formValid}
          onClick={handleConfirm}
          className={[
            "mt-5 h-14 w-full rounded-xl text-sm font-black transition",

            formValid
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "cursor-not-allowed bg-blue-600/20 text-white/30",
          ].join(" ")}
        >
          {loading ? "Menyiapkan Pembayaran..." : "Konfirmasi Pesanan"}
        </button>

        {!formValid && !loading && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Lengkapi data akun, pilih nominal dan metode pembayaran, lalu
            setujui ketentuan transaksi.
          </p>
        )}
      </div>
    </section>
  );
}
