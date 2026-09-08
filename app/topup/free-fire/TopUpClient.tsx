"use client";

import {
  useMemo,
  useState,
} from "react";

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

type PaymentMethod =
  | "qris"
  | "gopay"
  | "dana"
  | "ovo"
  | "shopeepay"
  | "bca_va"
  | "bni_va"
  | "bri_va"
  | "permata_va"
  | "mandiri_va";

type PaymentOption = {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
};

type PromoBenefit =
  | "FREE_PAYMENT_FEE"
  | "FIXED_DISCOUNT"
  | "PERCENT_DISCOUNT";

type PromoValidationResponse = {
  success?: boolean;
  valid?: boolean;
  benefit?: PromoBenefit;
  message?: string;

  paymentFeeWaived?: boolean;

  originalPrice?: number;

  discountAmount?: number;

  finalProductPrice?: number;

  remainingUses?: number | null;

  remainingCustomerUses?: number | null;
};

const BANK_VA_MINIMUM =
  50_000;

const bankTransferMethods =
  new Set<PaymentMethod>([
    "bca_va",
    "bni_va",
    "bri_va",
    "permata_va",
    "mandiri_va",
  ]);

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
          "Scan dari aplikasi pembayaran yang mendukung QRIS",

        icon: "QR",
      },
    ],
  },

  {
    title: "E-Wallet",

    items: [
      {
        id: "gopay",

        name: "GoPay",

        description:
          "GoPay",

        icon: "G",
      },

      {
        id: "dana",

        name: "DANA",

        description:
          "DANA",

        icon: "D",
      },

      {
        id: "ovo",

        name: "OVO",

        description:
          "OVO",

        icon: "O",
      },

      {
        id: "shopeepay",

        name: "ShopeePay",

        description:
          "ShopeePay",

        icon: "S",
      },
    ],
  },

  {
    title: "Virtual Account",

    items: [
      {
        id: "bca_va",

        name:
          "BCA Virtual Account",

        description:
          "BCA VA",

        icon: "BCA",
      },

      {
        id: "bni_va",

        name:
          "BNI Virtual Account",

        description:
          "BNI VA",

        icon: "BNI",
      },

      {
        id: "bri_va",

        name:
          "BRI Virtual Account",

        description:
          "BRI VA",

        icon: "BRI",
      },

      {
        id: "permata_va",

        name:
          "Permata Virtual Account",

        description:
          "Permata VA",

        icon: "P",
      },

      {
        id: "mandiri_va",

        name:
          "Mandiri Bill Payment",

        description:
          "Mandiri",

        icon: "M",
      },
    ],
  },
];

function formatRupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",

      currency: "IDR",

      minimumFractionDigits: 0,
    }
  ).format(value);
}

function isBankTransferMethod(
  paymentMethod:
    | PaymentMethod
    | null
) {
  return (
    paymentMethod !== null &&
    bankTransferMethods.has(
      paymentMethod
    )
  );
}

export default function TopUpClient({
  products,
}: TopUpClientProps) {
  const [
    uid,
    setUid,
  ] = useState("");

  const [
    whatsapp,
    setWhatsapp,
  ] = useState("");

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  ] =
    useState<PaymentMethod | null>(
      null
    );

  const [
    activeCategory,
    setActiveCategory,
  ] = useState<
    "diamond" | "membership"
  >("diamond");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * ================================
   * PROMO
   * ================================
   */

  const [
    promoCode,
    setPromoCode,
  ] = useState("");

  const [
    promoValid,
    setPromoValid,
  ] = useState(false);

  const [
    promoMessage,
    setPromoMessage,
  ] = useState("");

  const [
    validatingPromo,
    setValidatingPromo,
  ] = useState(false);

  /*
   * Jenis promo yang sudah divalidasi
   * oleh server.
   */

  const [
    promoBenefit,
    setPromoBenefit,
  ] =
    useState<PromoBenefit | null>(
      null
    );

  /*
   * Apakah promo membebaskan
   * payment fee.
   */

  const [
    promoPaymentFeeWaived,
    setPromoPaymentFeeWaived,
  ] = useState(false);

  /*
   * Snapshot preview harga promo.
   *
   * Nilai ini HANYA untuk tampilan.
   *
   * Backend tetap menghitung ulang
   * semuanya ketika membuat pembayaran.
   */

  const [
    promoOriginalPrice,
    setPromoOriginalPrice,
  ] =
    useState<number | null>(
      null
    );

  const [
    promoDiscountAmount,
    setPromoDiscountAmount,
  ] = useState(0);

  const [
    promoFinalProductPrice,
    setPromoFinalProductPrice,
  ] =
    useState<number | null>(
      null
    );

  /*
   * ================================
   * RESET HASIL PROMO
   * ================================
   *
   * Kode promo boleh tetap berada
   * di input.
   *
   * Tetapi hasil validasi sebelumnya
   * dibuang.
   *
   * Ini penting jika:
   *
   * - kode berubah
   * - produk berubah
   * - kategori berubah
   */

  function resetPromoValidation() {
    setPromoValid(false);

    setPromoMessage("");

    setPromoBenefit(null);

    setPromoPaymentFeeWaived(
      false
    );

    setPromoOriginalPrice(
      null
    );

    setPromoDiscountAmount(
      0
    );

    setPromoFinalProductPrice(
      null
    );
  }

  /*
   * ================================
   * PRODUK TERPILIH
   * ================================
   */

  const selectedProduct =
    useMemo(() => {
      return products.find(
        (product) =>
          product.id ===
          selectedProductId
      );
    }, [
      products,
      selectedProductId,
    ]);

  /*
   * ================================
   * HARGA FINAL PREVIEW
   * ================================
   *
   * Kalau promo diskon valid,
   * gunakan finalProductPrice
   * dari endpoint validate.
   *
   * Selain itu gunakan harga
   * produk normal.
   */

  const previewProductPrice =
    useMemo(() => {
      if (!selectedProduct) {
        return 0;
      }

      if (
        promoValid &&
        promoFinalProductPrice !==
          null &&
        Number.isInteger(
          promoFinalProductPrice
        ) &&
        promoFinalProductPrice > 0
      ) {
        return promoFinalProductPrice;
      }

      return selectedProduct.price;
    }, [
      selectedProduct,
      promoValid,
      promoFinalProductPrice,
    ]);

  /*
   * Apakah promo benar-benar
   * merupakan diskon harga produk.
   */

  const hasProductDiscount =
    promoValid &&
    promoDiscountAmount > 0 &&
    promoFinalProductPrice !==
      null;

  /*
   * ================================
   * PAYMENT TERPILIH
   * ================================
   */

  const selectedPayment =
    useMemo(() => {
      for (
        const group of
          paymentGroups
      ) {
        const payment =
          group.items.find(
            (item) =>
              item.id ===
              selectedPaymentMethod
          );

        if (payment) {
          return payment;
        }
      }

      return null;
    }, [
      selectedPaymentMethod,
    ]);

  /*
   * ================================
   * PRODUK
   * ================================
   */

  const diamondProducts =
    useMemo(() => {
      return [
        ...products,
      ].sort(
        (a, b) =>
          a.price -
          b.price
      );
    }, [products]);

  const membershipProducts:
    Product[] = [];

  const displayedProducts =
    activeCategory ===
    "diamond"
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
      whatsapp
    );

  const productValid =
    Boolean(
      selectedProduct
    );

  /*
   * Kalau payment adalah Bank/VA,
   * harga FINAL produk setelah promo
   * harus minimal Rp50.000.
   *
   * Contoh:
   *
   * Harga awal = Rp52.000
   * Diskon     = Rp5.000
   * Harga akhir = Rp47.000
   *
   * Maka VA tidak boleh dipakai.
   *
   * Ini hanya validasi UX.
   *
   * Backend tetap menjadi
   * pengaman utama.
   */

  const selectedBankPaymentAllowed =
    !isBankTransferMethod(
      selectedPaymentMethod
    ) ||
    Boolean(
      selectedProduct &&
        previewProductPrice >=
          BANK_VA_MINIMUM
    );

  const paymentValid =
    Boolean(
      selectedPaymentMethod
    ) &&
    selectedBankPaymentAllowed;

  const formValid =
    uidValid &&
    whatsappValid &&
    productValid &&
    paymentValid &&
    !loading;

  /*
   * ================================
   * INPUT
   * ================================
   */

  function handleUidChange(
    value: string
  ) {
    setUid(
      value.replace(
        /\D/g,
        ""
      )
    );

    setErrorMessage("");
  }

  function handleWhatsappChange(
  value: string
) {
  setWhatsapp(
    value.replace(
      /\D/g,
      ""
    )
  );

  /*
   * Promo customer-specific bergantung
   * pada nomor WhatsApp.
   *
   * Kalau nomor berubah, hasil validasi
   * promo sebelumnya harus dibuang.
   */
  resetPromoValidation();

  setErrorMessage("");
}

  /*
   * ================================
   * PILIH PRODUK
   * ================================
   */

  function handleSelectProduct(
    productId: string
  ) {
    const nextProduct =
      products.find(
        (product) =>
          product.id ===
          productId
      );

    setSelectedProductId(
      productId
    );

    /*
     * Hasil validasi promo sebelumnya
     * tidak boleh dibawa ke produk lain.
     *
     * Contoh:
     *
     * promo divalidasi untuk 355 DM,
     * lalu customer memilih 5 DM.
     *
     * Promo harus diperiksa ulang.
     */

    resetPromoValidation();

    /*
     * Karena promo baru saja di-reset,
     * harga yang aman digunakan untuk
     * pengecekan VA adalah harga produk
     * normal produk berikutnya.
     */

    if (
      nextProduct &&
      nextProduct.price <
        BANK_VA_MINIMUM &&
      isBankTransferMethod(
        selectedPaymentMethod
      )
    ) {
      setSelectedPaymentMethod(
        null
      );
    }

    setErrorMessage("");
  }

  function handleCategoryChange(
    category:
      | "diamond"
      | "membership"
  ) {
    setActiveCategory(
      category
    );

    resetPromoValidation();

    if (
      category ===
      "membership"
    ) {
      setSelectedProductId(
        ""
      );

      setSelectedPaymentMethod(
        null
      );
    }

    setErrorMessage("");
  }

  /*
   * ================================
   * PROMO
   * ================================
   *
   * Ketika isi kode berubah,
   * hasil validasi sebelumnya
   * langsung dianggap tidak berlaku.
   */

  function handlePromoChange(
    value: string
  ) {
    setPromoCode(value);

    resetPromoValidation();

    setErrorMessage("");
  }

  async function handleValidatePromo() {
    const cleanCode =
      promoCode.trim();

    if (!cleanCode) {
      resetPromoValidation();

      setPromoMessage(
        "Masukkan kode promo."
      );

      return;
    }

    /*
     * FREE_PAYMENT_FEE sebenarnya
     * dapat divalidasi tanpa productId.
     *
     * Tetapi frontend sekarang selalu
     * mengirim productId jika tersedia
     * supaya endpoint yang sama dapat
     * menangani promo diskon produk.
     */

    if (!selectedProduct) {
  resetPromoValidation();

  setPromoMessage(
    "Pilih nominal terlebih dahulu."
  );

  return;
}

/*
 * Promo first-order, loyal customer,
 * dan batas penggunaan per customer
 * membutuhkan nomor WhatsApp valid.
 */
if (!whatsappValid) {
  resetPromoValidation();

  setPromoMessage(
    "Masukkan nomor WhatsApp yang valid terlebih dahulu."
  );

  return;
}

try {

      resetPromoValidation();

      setErrorMessage("");

      const response =
        await fetch(
          "/api/promo/validate",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
  JSON.stringify({
    code:
      cleanCode,

    /*
     * WAJIB untuk
     * FIXED_DISCOUNT dan
     * PERCENT_DISCOUNT.
     */

    productId:
      selectedProduct.id,

    /*
     * Digunakan server untuk:
     *
     * - firstOrderOnly
     * - minCompletedOrders
     * - maxUsesPerCustomer
     *
     * Checkout tetap mengecek
     * ulang menggunakan WhatsApp
     * yang tersimpan di order.
     */
    whatsapp,
  }),
          }
        );

      const data =
        (await response.json()) as
          PromoValidationResponse;

      if (
        !response.ok ||
        !data.valid
      ) {
        resetPromoValidation();

        setPromoMessage(
          data.message ||
            "Kode promo tidak valid."
        );

        return;
      }

      /*
       * =================================
       * VALIDASI JENIS BENEFIT
       * =================================
       */

      if (
        data.benefit !==
          "FREE_PAYMENT_FEE" &&
        data.benefit !==
          "FIXED_DISCOUNT" &&
        data.benefit !==
          "PERCENT_DISCOUNT"
      ) {
        resetPromoValidation();

        setPromoMessage(
          "Jenis promo tidak didukung."
        );

        return;
      }

      /*
       * =================================
       * FREE PAYMENT FEE
       * =================================
       */

      if (
        data.benefit ===
        "FREE_PAYMENT_FEE"
      ) {
        setPromoBenefit(
          data.benefit
        );

        setPromoPaymentFeeWaived(
          true
        );

        setPromoOriginalPrice(
          selectedProduct.price
        );

        setPromoDiscountAmount(
          0
        );

        setPromoFinalProductPrice(
          selectedProduct.price
        );

        setPromoValid(
          true
        );

        setPromoMessage(
          data.message ||
            "Promo bebas biaya pembayaran berhasil digunakan."
        );

        /*
         * Harga produk tidak berubah,
         * jadi tidak perlu mengubah
         * pilihan VA di sini.
         */

        return;
      }

      /*
       * =================================
       * FIXED / PERCENT DISCOUNT
       * =================================
       *
       * Response harus memiliki:
       *
       * originalPrice
       * discountAmount
       * finalProductPrice
       */

      const originalPrice =
        data.originalPrice;

      const discountAmount =
        data.discountAmount;

      const finalProductPrice =
        data.finalProductPrice;

      if (
        typeof originalPrice !==
          "number" ||
        !Number.isInteger(
          originalPrice
        ) ||
        originalPrice <= 0 ||
        typeof discountAmount !==
          "number" ||
        !Number.isInteger(
          discountAmount
        ) ||
        discountAmount <= 0 ||
        typeof finalProductPrice !==
          "number" ||
        !Number.isInteger(
          finalProductPrice
        ) ||
        finalProductPrice <= 0
      ) {
        resetPromoValidation();

        setPromoMessage(
          "Data diskon promo tidak valid."
        );

        return;
      }

      /*
       * Harga awal yang dikembalikan
       * server harus sama dengan harga
       * produk yang sedang dipilih.
       *
       * Ini hanya consistency check
       * frontend.
       *
       * Backend tetap menghitung ulang
       * saat membuat pembayaran.
       */

      if (
        originalPrice !==
        selectedProduct.price
      ) {
        resetPromoValidation();

        setPromoMessage(
          "Harga produk berubah. Silakan pilih nominal kembali."
        );

        return;
      }

      /*
       * Pastikan secara matematis:
       *
       * original - discount = final.
       */

      if (
        originalPrice -
          discountAmount !==
        finalProductPrice
      ) {
        resetPromoValidation();

        setPromoMessage(
          "Perhitungan diskon promo tidak valid."
        );

        return;
      }

      setPromoBenefit(
        data.benefit
      );

      setPromoPaymentFeeWaived(
        false
      );

      setPromoOriginalPrice(
        originalPrice
      );

      setPromoDiscountAmount(
        discountAmount
      );

      setPromoFinalProductPrice(
        finalProductPrice
      );

      setPromoValid(
        true
      );

      setPromoMessage(
        data.message ||
          "Kode promo berhasil digunakan."
      );

      /*
       * =================================
       * VA MINIMUM SETELAH DISKON
       * =================================
       *
       * Jika customer sebelumnya memilih
       * Bank/VA tetapi promo membuat
       * harga final turun di bawah
       * Rp50.000, pilihan VA dibatalkan.
       */

      if (
        finalProductPrice <
          BANK_VA_MINIMUM &&
        isBankTransferMethod(
          selectedPaymentMethod
        )
      ) {
        setSelectedPaymentMethod(
          null
        );
      }
    } catch {
      resetPromoValidation();

      setPromoMessage(
        "Gagal memeriksa kode promo."
      );
    } finally {
      setValidatingPromo(
        false
      );
    }
  }

  /*
   * ================================
   * KONFIRMASI PESANAN
   * ================================
   */

  async function handleConfirm() {
    if (
      !formValid ||
      !selectedProduct ||
      !selectedPaymentMethod ||
      loading
    ) {
      return;
    }

    /*
     * Double check frontend.
     *
     * Untuk Bank/VA sekarang kita
     * menggunakan previewProductPrice,
     * yaitu harga setelah promo.
     *
     * Backend juga mengecek lagi,
     * jadi ini bukan satu-satunya
     * pengaman.
     */

    if (
      isBankTransferMethod(
        selectedPaymentMethod
      ) &&
      previewProductPrice <
        BANK_VA_MINIMUM
    ) {
      setErrorMessage(
        "Bank Transfer / Virtual Account tersedia untuk transaksi minimal Rp50.000. Silakan gunakan QRIS atau e-wallet."
      );

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
            method:
              "POST",

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
          }
        );

      const orderData =
        await orderResponse.json();

      if (
        !orderResponse.ok
      ) {
        throw new Error(
          orderData.message ||
            "Pesanan gagal dibuat."
        );
      }

      const invoice =
        orderData.order
          ?.invoice;

      if (!invoice) {
        throw new Error(
          "Invoice pesanan tidak ditemukan."
        );
      }

      /*
       * ================================
       * STEP 2
       * BUAT TRANSAKSI MIDTRANS
       * ================================
       *
       * promoCode tetap dikirim
       * ke backend.
       *
       * Backend akan:
       *
       * - mengambil promo dari DB
       * - mengecek masa berlaku
       * - mengecek maxUses
       * - menghitung ulang diskon
       * - mengecek minimumMargin
       * - mengecek VA minimum
       *
       * Jadi preview frontend TIDAK
       * menjadi sumber kebenaran.
       */

      const paymentResponse =
        await fetch(
          "/api/midtrans/create",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                invoice,

                paymentMethod:
                  selectedPaymentMethod,

                /*
                 * Hanya kirim kode promo
                 * kalau sudah divalidasi.
                 *
                 * Kalau user mengetik kode
                 * tetapi belum menekan
                 * "Gunakan", kode tersebut
                 * tidak ikut checkout.
                 */

                promoCode:
                  promoValid
                    ? promoCode.trim()
                    : "",
              }),
          }
        );

      const paymentData =
        await paymentResponse.json();

      if (
        !paymentResponse.ok
      ) {
        throw new Error(
          paymentData.message ||
            "Pembayaran gagal dibuat."
        );
      }

      if (
        !paymentData.redirectUrl
      ) {
        throw new Error(
          "Link pembayaran tidak ditemukan."
        );
      }

      /*
       * ================================
       * STEP 3
       * REDIRECT KE MIDTRANS
       * ================================
       */

      window.location.href =
        paymentData.redirectUrl;
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Terjadi kesalahan saat membuat pesanan."
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
                Pilih nominal dan
                metode pembayaran
                favoritmu.
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
                  event.target.value
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
              value={whatsapp}
              disabled={loading}
              onChange={(event) =>
                handleWhatsappChange(
                  event.target.value
                )
              }
              placeholder="Contoh: 081234567890"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {whatsapp.length >
              0 &&
              !whatsappValid && (
                <p className="mt-2 text-xs text-red-400">
                  Nomor WhatsApp harus
                  10–15 angka.
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
              Pilih produk yang ingin
              dibeli
            </p>
          </div>
        </div>

        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() =>
              handleCategoryChange(
                "diamond"
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

          <button
            type="button"
            onClick={() =>
              handleCategoryChange(
                "membership"
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
                        product.id
                      )
                    }
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
                      💎
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
                        product.price
                      )}
                    </p>
                  </button>
                );
              }
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-500">
            Membership segera
            tersedia.
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
              <div key={group.title}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-300">
                    {group.title}
                  </span>

                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {group.title ===
                  "Virtual Account" &&
                  selectedProduct &&
                  previewProductPrice <
                    BANK_VA_MINIMUM && (
                    <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-400">
                      Virtual Account
                      tersedia untuk
                      transaksi minimal{" "}
                      <span className="font-bold">
                        {formatRupiah(
                          BANK_VA_MINIMUM
                        )}
                      </span>
                      . Untuk nominal
                      ini gunakan QRIS
                      atau e-wallet.
                    </div>
                  )}

                <div
                  className={[
                    "grid gap-3",

                    group.items.length ===
                    1
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3",
                  ].join(" ")}
                >
                  {group.items.map(
                    (payment) => {
                      const selected =
                        selectedPaymentMethod ===
                        payment.id;

                      const isBank =
                        bankTransferMethods.has(
                          payment.id
                        );

                      const unavailableBecauseMinimum =
                        isBank &&
                        Boolean(
                          selectedProduct &&
                            previewProductPrice <
                              BANK_VA_MINIMUM
                        );

                      const disabled =
                        loading ||
                        unavailableBecauseMinimum;

                      return (
                        <button
                          key={
                            payment.id
                          }
                          type="button"
                          disabled={
                            disabled
                          }
                          onClick={() => {
                            if (
                              unavailableBecauseMinimum
                            ) {
                              return;
                            }

                            setSelectedPaymentMethod(
                              payment.id
                            );

                            setErrorMessage(
                              ""
                            );
                          }}
                          className={[
                            "flex min-h-[82px] items-center justify-between gap-4 rounded-xl border p-3 text-left transition",

                            unavailableBecauseMinimum
                              ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40"
                              : selected
                                ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                                : "border-white/10 bg-[#0a1020] hover:border-blue-500/50",
                          ].join(" ")}
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
                                {unavailableBecauseMinimum
                                  ? "Minimal transaksi Rp50.000"
                                  : payment.description}
                              </p>
                            </div>
                          </div>

                          {selected &&
                            !unavailableBecauseMinimum && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black">
                                ✓
                              </span>
                            )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )
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
              Periksa kembali
              pesananmu
            </p>
          </div>
        </div>

        {/* PROMO */}

        <div className="mb-5 rounded-xl border border-white/10 bg-[#060b16] p-4">
          <div className="mb-3">
            <p className="text-sm font-bold text-white">
              Kode Promo
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Opsional. Masukkan kode
              promo jika kamu
              memilikinya.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={promoCode}
              disabled={
                loading ||
                validatingPromo
              }
              onChange={(event) =>
                handlePromoChange(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  void handleValidatePromo();
                }
              }}
              placeholder="Masukkan kode promo"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="button"
              disabled={
                validatingPromo ||
                loading ||
                !promoCode.trim()
              }
              onClick={
                handleValidatePromo
              }
              className={[
                "h-12 rounded-xl px-6 text-sm font-black transition",

                validatingPromo ||
                loading ||
                !promoCode.trim()
                  ? "cursor-not-allowed bg-white/5 text-white/30"
                  : "bg-blue-600 text-white hover:bg-blue-500",
              ].join(" ")}
            >
              {validatingPromo
                ? "Memeriksa..."
                : "Gunakan"}
            </button>
          </div>

          {promoMessage && (
            <div
              className={[
                "mt-3 rounded-lg border px-3 py-2 text-xs font-semibold",

                promoValid
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400",
              ].join(" ")}
            >
              {promoValid
                ? `✓ ${promoMessage}`
                : promoMessage}
            </div>
          )}

          {promoValid && (
            <div className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              <div>
                {promoBenefit ===
                "FREE_PAYMENT_FEE" ? (
                  <>
                    <p className="text-xs font-bold text-emerald-400">
                      Bebas biaya
                      pembayaran
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Kamu hanya membayar
                      harga produk.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-emerald-400">
                      Diskon{" "}
                      {formatRupiah(
                        promoDiscountAmount
                      )}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Harga produk menjadi{" "}
                      {formatRupiah(
                        promoFinalProductPrice ??
                          previewProductPrice
                      )}
                      .
                    </p>
                  </>
                )}
              </div>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-400">
                AKTIF
              </span>
            </div>
          )}
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
                  {selectedPayment
                    ?.name ||
                    "Belum dipilih"}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs text-slate-500">
                  {hasProductDiscount
                    ? "Harga setelah promo"
                    : "Harga produk"}
                </p>

                {hasProductDiscount && (
                  <p className="mt-1 text-xs text-slate-500 line-through">
                    {formatRupiah(
                      promoOriginalPrice ??
                        selectedProduct.price
                    )}
                  </p>
                )}

                <p className="mt-1 text-xl font-black text-blue-400">
                  {formatRupiah(
                    previewProductPrice
                  )}
                </p>
              </div>
            </div>

            {hasProductDiscount && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400">
                    Harga produk
                  </span>

                  <span className="text-xs font-bold text-white">
                    {formatRupiah(
                      promoOriginalPrice ??
                        selectedProduct.price
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400">
                    Diskon
                  </span>

                  <span className="text-xs font-bold text-emerald-400">
                    -
                    {formatRupiah(
                      promoDiscountAmount
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-white">
                    Harga setelah promo
                  </span>

                  <span className="text-lg font-black text-white">
                    {formatRupiah(
                      previewProductPrice
                    )}
                  </span>
                </div>

                <div className="mt-3 rounded-lg border border-blue-500/10 bg-blue-500/5 px-3 py-2">
                  <p className="text-[11px] leading-5 text-slate-400">
                    Biaya pembayaran
                    akan dihitung
                    otomatis oleh
                    Midtrans berdasarkan
                    metode pembayaran
                    yang dipilih.
                  </p>
                </div>
              </div>
            )}

            {promoValid &&
              promoPaymentFeeWaived && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Harga produk
                    </span>

                    <span className="text-xs font-bold text-white">
                      {formatRupiah(
                        selectedProduct.price
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Biaya pembayaran
                    </span>

                    <span className="text-xs font-bold text-emerald-400">
                      Bebas
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-white">
                      Total
                    </span>

                    <span className="text-lg font-black text-white">
                      {formatRupiah(
                        selectedProduct.price
                      )}
                    </span>
                  </div>
                </div>
              )}

            {!promoValid && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs leading-5 text-slate-500">
                  Biaya pembayaran
                  akan dihitung
                  otomatis oleh
                  Midtrans sesuai
                  metode pembayaran
                  yang dipilih.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
            Pilih nominal terlebih
            dahulu.
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          disabled={
            !formValid
          }
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
              Lengkapi data akun,
              pilih nominal dan
              metode pembayaran.
            </p>
          )}
      </div>
    </section>
  );
}