"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCustomerTotal } from "@/lib/payment-fees";
import { getDiamondAmount } from "@/lib/pricing";

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

        description:
          "QRIS aman yang diproses melalui Midtrans",

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

export default function TopUpClient({
  products,
}: TopUpClientProps) {
  const [uid, setUid] = useState("");

  const [whatsapp, setWhatsapp] = useState("");
  const [accountWhatsapp, setAccountWhatsapp] = useState("");
  const [whatsappAutofilled, setWhatsappAutofilled] = useState(false);
  const whatsappManuallyEdited = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccountWhatsapp() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const result = await response.json();
        const savedWhatsapp = String(result.customer?.whatsapp ?? "")
          .replace(/\D/g, "")
          .trim();

        if (!cancelled && savedWhatsapp) {
          setAccountWhatsapp(savedWhatsapp);
          if (!whatsappManuallyEdited.current) {
            setWhatsapp(savedWhatsapp);
            setWhatsappAutofilled(true);
          }
        }
      } catch {
        // Checkout tetap bisa digunakan dengan input manual jika profil gagal dimuat.
      }
    }

    void loadAccountWhatsapp();

    return () => {
      cancelled = true;
    };
  }, []);

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const [activeCategory, setActiveCategory] =
    useState<"diamond" | "membership">(
      "diamond",
    );

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    finalProductPrice: number | null;
    paymentFeeWaived: boolean;
    message: string;
  } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);

  /*
   * ================================
   * PRODUK TERPILIH
   * ================================
   */

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        product.id === selectedProductId,
    );
  }, [products, selectedProductId]);

  const previewProductPrice =
    selectedProduct?.price ?? 0;

  /*
   * ================================
   * PAYMENT TERPILIH
   * ================================
   */

  const selectedPayment = useMemo(() => {
    for (const group of paymentGroups) {
      const payment =
        group.items.find(
          (item) =>
            item.id ===
            selectedPaymentMethod,
        );

      if (payment) {
        return payment;
      }
    }

    return null;
  }, [selectedPaymentMethod]);

  /*
   * ================================
   * HITUNG FEE + TOTAL CHECKOUT
   * ================================
   *
   * Aturan:
   *
   * 1–49 DM:
   * fee QRIS = Rp0 (ditanggung toko)
   *
   * 50+ DM dan Membership:
   * fee QRIS = 0,7% (dibayar pelanggan)
   *
   * Perhitungan menggunakan helper
   * yang sama dengan backend.
   */

  const previewPayment = useMemo(() => {
    if (!selectedProduct) {
      return {
        paymentFee: 0,
        customerTotal: 0,
      };
    }

    const diamondAmount =
      getDiamondAmount(
        selectedProduct.name,
        selectedProduct.sku,
      );

    return getCustomerTotal({
      productPrice:
        previewProductPrice,

      diamondAmount,

      paymentMethod:
        selectedPaymentMethod ?? "",
    });
  }, [
    selectedProduct,
    previewProductPrice,
    selectedPaymentMethod,
  ]);

  const appliedPromoMatches = Boolean(
    appliedPromo &&
    appliedPromo.code.toLowerCase() === promoCode.trim().toLowerCase(),
  );

  const effectiveProductPrice =
    appliedPromoMatches &&
    appliedPromo &&
    appliedPromo.finalProductPrice !== null
      ? appliedPromo.finalProductPrice
      : previewProductPrice;

  const recalculatedPayment = getCustomerTotal({
    productPrice: effectiveProductPrice,
    diamondAmount: selectedProduct
      ? getDiamondAmount(selectedProduct.name, selectedProduct.sku)
      : null,
    paymentMethod: selectedPaymentMethod ?? "",
  });

  const previewPaymentFee =
    appliedPromoMatches && appliedPromo?.paymentFeeWaived
      ? 0
      : recalculatedPayment.paymentFee;

  const previewCustomerTotal =
    effectiveProductPrice + previewPaymentFee;

  /*
   * ================================
   * PRODUK
   * ================================
   */

  const diamondProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          !product.sku.startsWith(
            "FF_MEMBERSHIP_",
          ),
      )
      .sort((a, b) => {
        const amountA =
          getDiamondAmount(
            a.name,
            a.sku,
          );

        const amountB =
          getDiamondAmount(
            b.name,
            b.sku,
          );

        if (
          amountA !== null &&
          amountB !== null
        ) {
          return amountA - amountB;
        }

        if (amountA !== null) {
          return -1;
        }

        if (amountB !== null) {
          return 1;
        }

        return a.price - b.price;
      });
  }, [products]);

  const membershipProducts = useMemo(() => {
    return products
      .filter((product) =>
        product.sku.startsWith(
          "FF_MEMBERSHIP_",
        ),
      )
      .sort(
        (a, b) =>
          a.price - b.price,
      );
  }, [products]);

  const displayedProducts =
    activeCategory === "diamond"
      ? diamondProducts
      : membershipProducts;

  /*
   * ================================
   * VALIDASI FORM
   * ================================
   */

  const uidValid =
    /^\d{6,}$/.test(uid);

  const whatsappValid =
    /^\d{10,15}$/.test(
      whatsapp,
    );

  const productValid =
    Boolean(selectedProduct);

  const paymentValid =
    Boolean(
      selectedPaymentMethod,
    );

  const promoReady = !promoCode.trim() || appliedPromoMatches;

  const formValid =
    uidValid &&
    whatsappValid &&
    productValid &&
    paymentValid &&
    acceptedTerms &&
    promoReady &&
    !validatingPromo &&
    !loading;

  /*
   * ================================
   * INPUT
   * ================================
   */

  function handleUidChange(
    value: string,
  ) {
    setUid(
      value.replace(/\D/g, ""),
    );

    setErrorMessage("");
  }

  function handleWhatsappChange(
    value: string,
  ) {
    whatsappManuallyEdited.current = true;
    setWhatsapp(
      value.replace(/\D/g, ""),
    );
    setWhatsappAutofilled(false);

    setAppliedPromo(null);
    setPromoMessage(
      promoCode.trim()
        ? "Nomor WhatsApp berubah. Terapkan ulang kode promo."
        : "",
    );
    setErrorMessage("");
  }

  /*
   * ================================
   * PILIH PRODUK
   * ================================
   */

  function handleSelectProduct(
    productId: string,
  ) {
    setSelectedProductId(
      productId,
    );

    setAppliedPromo(null);
    setPromoMessage(promoCode.trim() ? "Nominal berubah. Terapkan ulang kode promo." : "");
    setErrorMessage("");
  }

  function handleCategoryChange(
    category:
      | "diamond"
      | "membership",
  ) {
    setActiveCategory(
      category,
    );

    setSelectedProductId("");

    setSelectedPaymentMethod(
      null,
    );

    setAppliedPromo(null);
    setPromoMessage(promoCode.trim() ? "Pilihan produk berubah. Terapkan ulang kode promo." : "");
    setErrorMessage("");
  }

  /*
   * ================================
   * KONFIRMASI PESANAN
   * ================================
   */

  async function handleApplyPromo() {
    const code = promoCode.trim();

    if (!code) {
      setAppliedPromo(null);
      setPromoMessage("Masukkan kode promo terlebih dahulu.");
      return;
    }
    if (!selectedProduct) {
      setAppliedPromo(null);
      setPromoMessage("Pilih nominal terlebih dahulu.");
      return;
    }
    if (!whatsappValid) {
      setAppliedPromo(null);
      setPromoMessage("Masukkan nomor WhatsApp yang valid terlebih dahulu.");
      return;
    }

    try {
      setValidatingPromo(true);
      setAppliedPromo(null);
      setPromoMessage("");

      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          productId: selectedProduct.id,
          whatsapp,
        }),
      });
      const result = await response.json();

      if (result.requiresLogin || response.status === 401) {
        setLoginRequired(true);
        setPromoMessage(
          result.message ||
            "Login ke akun 7 April Store terlebih dahulu untuk menggunakan kode promo.",
        );
        return;
      }

      if (!response.ok || !result.valid) {
        setLoginRequired(false);
        setPromoMessage(result.message || "Kode promo tidak dapat digunakan.");
        return;
      }

      setLoginRequired(false);

      setAppliedPromo({
        code,
        discountAmount: Number(result.discountAmount ?? 0),
        finalProductPrice:
          result.finalProductPrice === null || result.finalProductPrice === undefined
            ? null
            : Number(result.finalProductPrice),
        paymentFeeWaived: Boolean(result.paymentFeeWaived),
        message: String(result.message ?? "Kode promo berhasil digunakan."),
      });
      setPromoMessage(
        result.paymentFeeWaived
          ? "Kode promo aktif — biaya pembayaran gratis."
          : "Kode promo aktif — diskon Rp" +
              Number(result.discountAmount ?? 0).toLocaleString("id-ID") + ".",
      );
      setErrorMessage("");
    } catch {
      setPromoMessage("Tidak dapat memeriksa kode promo. Coba lagi.");
    } finally {
      setValidatingPromo(false);
    }
  }

  async function handleConfirm() {
    if (
      !formValid ||
      !selectedProduct ||
      !selectedPaymentMethod ||
      loading
    ) {
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

      const orderResponse =
        await fetch(
          "/api/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                uid,

                whatsapp,

                productId:
                  selectedProduct.id,
              }),
          },
        );

      const orderData =
        await orderResponse.json();

      if (
        !orderResponse.ok
      ) {
        throw new Error(
          orderData.message ||
            "Pesanan gagal dibuat.",
        );
      }

      const invoice =
        orderData.order?.invoice;

      if (!invoice) {
        throw new Error(
          "Invoice pesanan tidak ditemukan.",
        );
      }

      /*
       * ================================
       * STEP 2
       * BUAT PEMBAYARAN MIDTRANS
       * ================================
       */

      const paymentResponse =
        await fetch(
          "/api/midtrans/create",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                invoice,

                paymentMethod:
                  selectedPaymentMethod,

                ...(appliedPromoMatches
                  ? { promoCode: appliedPromo?.code }
                  : {}),
              }),
          },
        );

      const paymentData =
        await paymentResponse.json();

      if (
        !paymentResponse.ok
      ) {
        throw new Error(
          paymentData.message ||
            "Pembayaran gagal dibuat.",
        );
      }

      if (
        !paymentData.redirectUrl
      ) {
        throw new Error(
          "Link pembayaran tidak ditemukan.",
        );
      }

      /*
       * ================================
       * STEP 3
       * REDIRECT KE HALAMAN PEMBAYARAN
       * ================================
       */

      window.location.href =
        paymentData.redirectUrl;
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setErrorMessage(
          error.message,
        );
      } else {
        setErrorMessage(
          "Terjadi kesalahan saat membuat pesanan.",
        );
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
            <h2 className="font-bold text-white">
              Masukkan Data Akun
            </h2>

            <p className="text-xs text-slate-500">
              Pastikan data akun benar
            </p>
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
              onChange={(event) =>
                handleUidChange(
                  event.target.value,
                )
              }
              placeholder="Contoh: 123456789"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {uid.length > 0 &&
              !uidValid && (
                <p className="mt-2 text-xs text-red-400">
                  UID minimal 6 angka.
                </p>
              )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">
              Nomor WhatsApp
            </label>

            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={whatsapp}
              disabled={loading}
              onChange={(event) =>
                handleWhatsappChange(
                  event.target.value,
                )
              }
              placeholder="Contoh: 081234567890"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-2 text-sm leading-6 text-blue-200">
              Nomor ini digunakan admin untuk menghubungimu jika pesanan mengalami kendala, misalnya pembayaran berhasil tetapi diamond belum masuk atau status pesanan bermasalah. Pastikan nomor WhatsApp aktif dan bisa dihubungi.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {whatsappAutofilled
                ? "Nomor WhatsApp akunmu diisi otomatis. Kamu bisa menghapus atau menggantinya jika nomor sudah tidak aktif."
                : accountWhatsapp && whatsapp !== accountWhatsapp
                  ? "Nomor sudah diedit. Gunakan nomor WhatsApp yang aktif untuk menerima informasi pesanan."
                  : "Masukkan nomor WhatsApp aktif untuk informasi pesanan."}
            </p>

            {whatsapp.length > 0 &&
              !whatsappValid && (
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
            <h2 className="font-bold text-white">
              Pilih Nominal Top Up
            </h2>

            <p className="text-xs text-slate-500">
              Pilih produk yang ingin dibeli
            </p>
          </div>
        </div>

        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() =>
              handleCategoryChange(
                "diamond",
              )
            }
            className={[
              "rounded-xl border px-4 py-2.5 text-sm font-bold transition",

              activeCategory ===
              "diamond"
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-white/10 text-slate-400",
            ].join(" ")}
          >
            💎 Diamond
          </button>

          {membershipProducts.length >
            0 && (
            <button
              type="button"
              onClick={() =>
                handleCategoryChange(
                  "membership",
                )
              }
              className={[
                "rounded-xl border px-4 py-2.5 text-sm font-bold transition",

                activeCategory ===
                "membership"
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-white/10 text-slate-400",
              ].join(" ")}
            >
              🎟 Membership
            </button>
          )}
        </div>

        {displayedProducts.length >
        0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayedProducts.map(
              (product) => {
                const selected =
                  selectedProductId ===
                  product.id;

                return (
                  <button
                    key={
                      product.id
                    }
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={() =>
                      handleSelectProduct(
                        product.id,
                      )
                    }
                    className={[
                      "relative min-h-[115px] rounded-xl border p-3 text-left transition",

                      selected
                        ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                        : "border-white/10 bg-[#0a1020] hover:border-blue-500/60",
                    ].join(" ")}
                  >
                    <div className="text-lg">
                      {activeCategory ===
                      "membership"
                        ? "🎟"
                        : "💎"}
                    </div>

                    <p className="mt-3 text-sm font-bold text-white">
                      {
                        product.name
                      }
                    </p>

                    <p className="mt-1 text-[9px] uppercase text-slate-600">
                      Harga
                    </p>

                    <p className="text-sm font-black text-blue-400">
                      {formatRupiah(
                        product.price,
                      )}
                    </p>
                  </button>
                );
              },
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-500">
            {activeCategory ===
            "membership"
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
            <h2 className="font-bold text-white">
              Pilih Pembayaran
            </h2>

            <p className="text-xs text-slate-500">
              Pilih metode pembayaran
            </p>
          </div>
        </div>

        <div className="space-y-7">
          {paymentGroups.map(
            (group) => (
              <div
                key={
                  group.title
                }
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-300">
                    {
                      group.title
                    }
                  </span>

                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div
                  className={[
                    "grid gap-3",

                    group.items
                      .length ===
                    1
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3",
                  ].join(" ")}
                >
                  {group.items.map(
                    (
                      payment,
                    ) => {
                      const selected =
                        selectedPaymentMethod ===
                        payment.id;

                      return (
                        <button
                          key={
                            payment.id
                          }
                          type="button"
                          disabled={
                            loading
                          }
                          onClick={() => {
                            setSelectedPaymentMethod(
                              payment.id,
                            );

                            setErrorMessage(
                              "",
                            );
                          }}
                          className={[
                            "flex min-h-[82px] items-center justify-between gap-4 rounded-xl border p-3 text-left transition",

                            selected
                              ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                              : "border-white/10 bg-[#0a1020] hover:border-blue-500/50",
                          ].join(
                            " ",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 min-w-12 items-center justify-center rounded-lg bg-white px-2 text-xs font-black text-slate-900">
                              {
                                payment.icon
                              }
                            </div>

                            <div>
                              <p className="text-sm font-bold text-white">
                                {
                                  payment.name
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500">
                                {
                                  payment.description
                                }
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
                    },
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* STEP 4 */}

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black">
            4
          </div>

          <div>
            <h2 className="font-bold text-white">
              Konfirmasi Pesanan
            </h2>

            <p className="text-xs text-slate-500">
              Periksa kembali pesananmu
            </p>
          </div>
        </div>

        {/* RINGKASAN */}

        {selectedProduct ? (
          <div className="rounded-xl border border-white/10 bg-[#060b16] p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">
                  Produk
                </p>

                <p className="mt-1 font-bold text-white">
                  {
                    selectedProduct.name
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Pembayaran
                </p>

                <p className="mt-1 font-bold text-white">
                  {selectedPayment?.name ||
                    "Belum dipilih"}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs text-slate-500">
                  Harga produk
                </p>

                <p className="mt-1 text-xl font-black text-blue-400">
                  {formatRupiah(
                    previewProductPrice,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Harga produk
                  </span>

                  <span className="font-semibold text-slate-300">
                    {formatRupiah(
                      previewProductPrice,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Biaya QRIS
                  </span>

                  <span
                    className={
                      previewPaymentFee >
                      0
                        ? "font-semibold text-slate-300"
                        : "font-semibold text-emerald-400"
                    }
                  >
                    {previewPaymentFee >
                    0
                      ? formatRupiah(
                          previewPaymentFee,
                        )
                      : "Gratis"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                  <span className="font-bold text-white">
                    Total yang dibayar
                  </span>

                  <span className="text-xl font-black text-blue-400">
                    {formatRupiah(
                      previewCustomerTotal,
                    )}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Total di atas adalah nominal yang akan dibayarkan melalui QRIS
                Midtrans.
              </p>

              {selectedPaymentMethod ===
                "qris" &&
                selectedProduct &&
                getDiamondAmount(selectedProduct.name, selectedProduct.sku) !== null &&
                getDiamondAmount(selectedProduct.name, selectedProduct.sku)! <= 49 &&
                previewPaymentFee === 0 && (
                  <p className="mt-2 text-xs text-emerald-400">
                    Untuk nominal 1–49 DM, biaya QRIS ditanggung oleh 7 April Store.
                  </p>
                )}
              {selectedPaymentMethod === "qris" &&
                selectedProduct &&
                (getDiamondAmount(selectedProduct.name, selectedProduct.sku) === null ||
                  getDiamondAmount(selectedProduct.name, selectedProduct.sku)! >= 50) && (
                  <p className="mt-2 text-xs leading-5 text-amber-300">
                    Biaya layanan QRIS sebesar 0,7% ditambahkan ke total pembayaran dan ditanggung oleh pelanggan.
                  </p>
                )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
            Pilih nominal terlebih dahulu.
          </div>
        )}

        <div className="mt-5 rounded-xl border border-blue-500/25 bg-[#060b16] p-4">
          <h3 className="text-sm font-bold text-white">Punya Kode Promo?</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Punya kode? Masukkan di sini lalu tekan Terapkan sebelum konfirmasi pesanan. Belum punya? Kode promo dan info promo tertentu dibagikan lewat saluran WhatsApp 7 April FF.
          </p>
          <a
            href="https://whatsapp.com/channel/0029VbByfE60VycAQEP6Tz1b"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-300 transition hover:bg-green-500/20"
          >
            Cari Kode Promo di Saluran WA <span aria-hidden="true">↗</span>
          </a>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={promoCode}
              disabled={loading || validatingPromo}
              onChange={(event) => {
                setPromoCode(event.target.value);
                setAppliedPromo(null);
                setPromoMessage("");
                setLoginRequired(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleApplyPromo();
                }
              }}
              placeholder="Masukkan kode promo"
              autoCapitalize="characters"
              className="h-14 min-w-0 w-full flex-1 rounded-xl border border-white/10 bg-[#030712] px-4 text-base font-semibold uppercase tracking-wide text-white outline-none placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60 sm:h-12 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => void handleApplyPromo()}
              disabled={loading || validatingPromo || !promoCode.trim()}
              className="h-11 shrink-0 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {validatingPromo ? "Memeriksa..." : "Terapkan"}
            </button>
          </div>
          {promoMessage && (
            <p
              role="status"
              className={[
                "mt-3 text-xs font-semibold leading-5",
                appliedPromoMatches ? "text-emerald-400" : "text-amber-300",
              ].join(" ")}
            >
              {appliedPromoMatches ? "✓ " : ""}
              {promoMessage}
            </p>
          )}
          {loginRequired && (
            <Link
              href="/login?redirect=%2Ftopup%2Ffree-fire"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20"
            >
              Login untuk Pakai Promo
            </Link>
          )}
          {appliedPromoMatches && (
            <button
              type="button"
              onClick={() => {
                setPromoCode("");
                setAppliedPromo(null);
                setPromoMessage("");
                setLoginRequired(false);
              }}
              className="mt-2 text-xs font-semibold text-slate-400 underline underline-offset-2 hover:text-white"
            >
              Hapus kode promo
            </button>
          )}
        </div>

        {appliedPromoMatches && selectedProduct && (
          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-300">Harga produk</span>
              <span className="text-slate-400 line-through">{formatRupiah(previewProductPrice)}</span>
            </div>
            {appliedPromo?.discountAmount ? (
              <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                <span className="text-emerald-400">Diskon promo</span>
                <span className="font-bold text-emerald-400">−{formatRupiah(appliedPromo.discountAmount)}</span>
              </div>
            ) : null}
            {appliedPromo?.paymentFeeWaived && (
              <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                <span className="text-emerald-400">Biaya pembayaran</span>
                <span className="font-bold text-emerald-400">Gratis dengan promo</span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-emerald-500/20 pt-3">
              <span className="font-bold text-white">Total setelah promo</span>
              <span className="text-lg font-black text-emerald-300">{formatRupiah(previewCustomerTotal)}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <div
          className={[
            "mt-5 rounded-xl border p-4 transition-colors",
            acceptedTerms
              ? "border-emerald-500/50 bg-emerald-500/[0.07]"
              : "border-amber-400/70 bg-amber-400/[0.07] shadow-[0_0_22px_rgba(251,191,36,0.08)]",
          ].join(" ")}
        >
          <p className={[
            "mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide",
            acceptedTerms ? "text-emerald-300" : "text-amber-300",
          ].join(" ")}>
            <span aria-hidden="true">{acceptedTerms ? "✓" : "☝️"}</span>
            {acceptedTerms
              ? "Persetujuan sudah dicentang"
              : "Langkah terakhir — wajib dicentang"}
          </p>

          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-200">
            <input
              type="checkbox"
              checked={acceptedTerms}
              disabled={loading}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setErrorMessage("");
              }}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b16]"
            />

            <span>
              <span className="font-bold text-white">
                Centang kotak ini untuk mengaktifkan tombol Konfirmasi Pesanan.
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-300">
                Saya telah memeriksa UID dan nominal, serta menyetujui{" "}
                <Link
                  href="/syarat-ketentuan"
                  target="_blank"
                  className="font-semibold text-blue-300 underline underline-offset-2 hover:text-blue-200"
                >
                  Syarat dan Ketentuan
                </Link>
                ,{" "}
                <Link
                  href="/kebijakan-pengiriman"
                  target="_blank"
                  className="font-semibold text-blue-300 underline underline-offset-2 hover:text-blue-200"
                >
                  Kebijakan Pengiriman
                </Link>{" "}
                dan{" "}
                <Link
                  href="/kebijakan-refund"
                  target="_blank"
                  className="font-semibold text-blue-300 underline underline-offset-2 hover:text-blue-200"
                >
                  Kebijakan Refund
                </Link>
                .
              </span>
            </span>
          </label>
        </div>

        <button
          type="button"
          disabled={!formValid}
          onClick={
            handleConfirm
          }
          className={[
            "mt-5 h-14 w-full rounded-xl text-sm font-black transition",

            formValid
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "cursor-not-allowed bg-blue-600/20 text-white/30",
          ].join(" ")}
        >
          {loading
            ? "Menyiapkan Pembayaran..."
            : "Konfirmasi Pesanan"}
        </button>

        {!formValid &&
          !loading && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Lengkapi data akun, pilih nominal dan metode pembayaran, lalu
              setujui ketentuan transaksi.
            </p>
          )}
      </div>
    </section>
  );
}