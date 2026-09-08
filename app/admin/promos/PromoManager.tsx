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
  active: boolean;
};

type Promo = {
  id: string;
  code: string;
  name: string | null;
  description: string | null;

  type: string;
  active: boolean;

  discountValue: number | null;
  maxDiscount: number | null;

  minOrder: number | null;
  minimumMargin: number;

  startsAt: string | Date | null;
  expiresAt: string | Date | null;

  maxUses: number | null;
  usedCount: number;

  maxUsesPerCustomer:
    | number
    | null;

  firstOrderOnly: boolean;

  minCompletedOrders:
    | number
    | null;

  productId: string | null;

  product:
    | Product
    | null;
};

type PromoManagerProps = {
  initialPromos: Promo[];
  products: Product[];
};

type PromoType =
  | "FREE_PAYMENT_FEE"
  | "FIXED_DISCOUNT"
  | "PERCENT_DISCOUNT";

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

function formatDate(
  value:
    | string
    | Date
    | null
) {
  if (!value) {
    return "Tidak ada";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Tidak ada";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function toDateTimeLocal(
  value:
    | string
    | Date
    | null
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const pad = (
    value: number
  ) =>
    String(value).padStart(
      2,
      "0"
    );

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(
    date.getDate()
  )}T${pad(
    date.getHours()
  )}:${pad(
    date.getMinutes()
  )}`;
}

function getPromoTypeLabel(
  type: string
) {
  if (
    type ===
    "FREE_PAYMENT_FEE"
  ) {
    return "Bebas Biaya Pembayaran";
  }

  if (
    type ===
    "FIXED_DISCOUNT"
  ) {
    return "Diskon Nominal";
  }

  if (
    type ===
    "PERCENT_DISCOUNT"
  ) {
    return "Diskon Persen";
  }

  return type;
}

function getPromoBenefitText(
  promo: Promo
) {
  if (
    promo.type ===
    "FREE_PAYMENT_FEE"
  ) {
    return "Bebas biaya pembayaran";
  }

  if (
    promo.type ===
      "FIXED_DISCOUNT" &&
    promo.discountValue
  ) {
    return formatRupiah(
      promo.discountValue
    );
  }

  if (
    promo.type ===
      "PERCENT_DISCOUNT" &&
    promo.discountValue
  ) {
    const cap =
      promo.maxDiscount
        ? ` • Maks ${formatRupiah(
            promo.maxDiscount
          )}`
        : "";

    return `${promo.discountValue}%${cap}`;
  }

  return "-";
}

export default function PromoManager({
  initialPromos,
  products,
}: PromoManagerProps) {
  const [
    promos,
    setPromos,
  ] = useState<Promo[]>(
    initialPromos
  );

  const [
    code,
    setCode,
  ] = useState("");

  const [
    name,
    setName,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    type,
    setType,
  ] =
    useState<PromoType>(
      "FREE_PAYMENT_FEE"
    );

  const [
    discountValue,
    setDiscountValue,
  ] = useState("");

  const [
    maxDiscount,
    setMaxDiscount,
  ] = useState("");

  const [
    minOrder,
    setMinOrder,
  ] = useState("");

  const [
    minimumMargin,
    setMinimumMargin,
  ] = useState("0");

  const [
    maxUses,
    setMaxUses,
  ] = useState("");

  const [
    maxUsesPerCustomer,
    setMaxUsesPerCustomer,
  ] = useState("");

  const [
    firstOrderOnly,
    setFirstOrderOnly,
  ] = useState(false);

  const [
    minCompletedOrders,
    setMinCompletedOrders,
  ] = useState("");

  const [
    productId,
    setProductId,
  ] = useState("");

  const [
    startsAt,
    setStartsAt,
  ] = useState("");

  const [
    expiresAt,
    setExpiresAt,
  ] = useState("");

  const [
    active,
    setActive,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    editingPromoId,
    setEditingPromoId,
  ] = useState<
    string | null
  >(null);

  const [
    actionPromoId,
    setActionPromoId,
  ] = useState<
    string | null
  >(null);

  const activePromoCount =
    useMemo(() => {
      return promos.filter(
        (promo) => promo.active
      ).length;
    }, [promos]);

  const totalUsage =
    useMemo(() => {
      return promos.reduce(
        (total, promo) =>
          total +
          promo.usedCount,
        0
      );
    }, [promos]);

  function optionalNumber(
    value: string
  ) {
    if (!value.trim()) {
      return null;
    }

    return Number(value);
  }

  function resetForm() {
    setCode("");
    setName("");
    setDescription("");

    setType(
      "FREE_PAYMENT_FEE"
    );

    setDiscountValue("");
    setMaxDiscount("");
    setMinOrder("");

    setMinimumMargin("0");

    setMaxUses("");
    setMaxUsesPerCustomer("");

    setFirstOrderOnly(false);
    setMinCompletedOrders("");

    setProductId("");

    setStartsAt("");
    setExpiresAt("");

    setActive(true);
  }

  function handleEditPromo(
    promo: Promo
  ) {
    setMessage("");
    setError("");

    setEditingPromoId(
      promo.id
    );

    setCode(promo.code);

    setName(
      promo.name ?? ""
    );

    setDescription(
      promo.description ?? ""
    );

    setType(
      promo.type as PromoType
    );

    setDiscountValue(
      promo.discountValue !==
        null
        ? String(
            promo.discountValue
          )
        : ""
    );

    setMaxDiscount(
      promo.maxDiscount !== null
        ? String(
            promo.maxDiscount
          )
        : ""
    );

    setMinOrder(
      promo.minOrder !== null
        ? String(
            promo.minOrder
          )
        : ""
    );

    setMinimumMargin(
      String(
        promo.minimumMargin
      )
    );

    setMaxUses(
      promo.maxUses !== null
        ? String(
            promo.maxUses
          )
        : ""
    );

    setMaxUsesPerCustomer(
      promo.maxUsesPerCustomer !==
        null
        ? String(
            promo.maxUsesPerCustomer
          )
        : ""
    );

    setFirstOrderOnly(
      promo.firstOrderOnly
    );

    setMinCompletedOrders(
      promo.minCompletedOrders !==
        null
        ? String(
            promo.minCompletedOrders
          )
        : ""
    );

    setProductId(
      promo.productId ?? ""
    );

    setStartsAt(
      toDateTimeLocal(
        promo.startsAt
      )
    );

    setExpiresAt(
      toDateTimeLocal(
        promo.expiresAt
      )
    );

    setActive(
      promo.active
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingPromoId(null);

    resetForm();

    setMessage("");
    setError("");
  }

  async function handleSavePromo(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setMessage("");
    setError("");

    const cleanCode = code.trim();

    if (!cleanCode) {
      setError(
        "Kode promo wajib diisi."
      );

      return;
    }

    if (
      type !==
        "FREE_PAYMENT_FEE" &&
      !discountValue
    ) {
      setError(
        "Nilai diskon wajib diisi."
      );

      return;
    }

    if (
      firstOrderOnly &&
      minCompletedOrders.trim() &&
      Number(
        minCompletedOrders
      ) > 0
    ) {
      setError(
        "Promo order pertama tidak dapat digabung dengan minimal transaksi selesai."
      );

      return;
    }

    try {
      setLoading(true);

      const isEditing =
        editingPromoId !== null;

      const endpoint =
        isEditing
          ? `/api/admin/promos/${editingPromoId}`
          : "/api/admin/promos";

      const response =
        await fetch(
          endpoint,
          {
            method:
              isEditing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                code:
                  cleanCode,

                name:
                  name.trim() ||
                  null,

                description:
                  description.trim() ||
                  null,

                type,

                active,

                discountValue:
                  type ===
                  "FREE_PAYMENT_FEE"
                    ? null
                    : optionalNumber(
                        discountValue
                      ),

                maxDiscount:
                  type ===
                  "PERCENT_DISCOUNT"
                    ? optionalNumber(
                        maxDiscount
                      )
                    : null,

                minOrder:
                  optionalNumber(
                    minOrder
                  ),

                minimumMargin:
                  optionalNumber(
                    minimumMargin
                  ) ?? 0,

                maxUses:
                  optionalNumber(
                    maxUses
                  ),

                maxUsesPerCustomer:
                  optionalNumber(
                    maxUsesPerCustomer
                  ),

                firstOrderOnly,

                minCompletedOrders:
                  optionalNumber(
                    minCompletedOrders
                  ),

                productId:
                  productId ||
                  null,

                startsAt:
                  startsAt ||
                  null,

                expiresAt:
                  expiresAt ||
                  null,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Gagal memperbarui promo."
              : "Gagal membuat promo.")
        );
      }

      if (!data.promo) {
        throw new Error(
          "Data promo tidak ditemukan."
        );
      }

      if (isEditing) {
        setPromos(
          (current) =>
            current.map(
              (promo) =>
                promo.id ===
                editingPromoId
                  ? data.promo
                  : promo
            )
        );
      } else {
        setPromos(
          (current) => [
            data.promo,
            ...current,
          ]
        );
      }

      setEditingPromoId(
        null
      );

      resetForm();

      setMessage(
        data.message ||
          (isEditing
            ? "Promo berhasil diperbarui."
            : "Promo berhasil dibuat.")
      );
    } catch (caughtError) {
      if (
        caughtError instanceof
        Error
      ) {
        setError(
          caughtError.message
        );
      } else {
        setError(
          "Gagal menyimpan promo."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePromo(
    promo: Promo
  ) {
    if (
      loading ||
      actionPromoId
    ) {
      return;
    }

    setMessage("");
    setError("");

    setActionPromoId(
      promo.id
    );

    try {
      const response =
        await fetch(
          `/api/admin/promos/${promo.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                active:
                  !promo.active,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal mengubah status promo."
        );
      }

      if (!data.promo) {
        throw new Error(
          "Data promo tidak ditemukan."
        );
      }

      setPromos(
        (current) =>
          current.map(
            (currentPromo) =>
              currentPromo.id ===
              promo.id
                ? data.promo
                : currentPromo
          )
      );

      if (
        editingPromoId ===
        promo.id
      ) {
        setActive(
          data.promo.active
        );
      }

      setMessage(
        data.message ||
          "Status promo berhasil diperbarui."
      );
    } catch (caughtError) {
      if (
        caughtError instanceof
        Error
      ) {
        setError(
          caughtError.message
        );
      } else {
        setError(
          "Gagal mengubah status promo."
        );
      }
    } finally {
      setActionPromoId(
        null
      );
    }
  }

  async function handleDeletePromo(
    promo: Promo
  ) {
    if (
      loading ||
      actionPromoId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Hapus promo ${promo.code}? Promo yang sudah memiliki histori order tidak dapat dihapus.`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    setActionPromoId(
      promo.id
    );

    try {
      const response =
        await fetch(
          `/api/admin/promos/${promo.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal menghapus promo."
        );
      }

      setPromos(
        (current) =>
          current.filter(
            (currentPromo) =>
              currentPromo.id !==
              promo.id
          )
      );

      if (
        editingPromoId ===
        promo.id
      ) {
        setEditingPromoId(
          null
        );

        resetForm();
      }

      setMessage(
        data.message ||
          "Promo berhasil dihapus."
      );
    } catch (caughtError) {
      if (
        caughtError instanceof
        Error
      ) {
        setError(
          caughtError.message
        );
      } else {
        setError(
          "Gagal menghapus promo."
        );
      }
    } finally {
      setActionPromoId(
        null
      );
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Promo
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {promos.length}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Promo Aktif
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {activePromoCount}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Total Digunakan
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {totalUsage}
          </p>
        </div>
      </div>

      <form
        onSubmit={
          handleSavePromo
        }
        className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6"
      >
        <div className="mb-6">
          <h2 className="text-lg font-black text-white">
            {editingPromoId
              ? "Edit Promo"
              : "Buat Promo Baru"}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {editingPromoId
              ? "Ubah pengaturan promo lalu simpan perubahan."
              : "Atur jenis promo, periode, kuota, dan syarat pelanggan."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Kode Promo *
            </label>

            <input
              value={code}
              disabled={loading}
              onChange={(event) =>
  setCode(event.target.value)
}
              placeholder="CONTOH10"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Nama Promo
            </label>

            <input
              value={name}
              disabled={loading}
              onChange={(
                event
              ) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Promo September"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Deskripsi
            </label>

            <textarea
              value={
                description
              }
              disabled={loading}
              onChange={(
                event
              ) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Catatan tentang promo..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#060b16] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Jenis Promo *
            </label>

            <select
              value={type}
              disabled={loading}
              onChange={(
                event
              ) => {
                const nextType =
                  event.target
                    .value as PromoType;

                setType(
                  nextType
                );

                if (
                  nextType ===
                  "FREE_PAYMENT_FEE"
                ) {
                  setDiscountValue(
                    ""
                  );

                  setMaxDiscount(
                    ""
                  );
                }
              }}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="FREE_PAYMENT_FEE">
                Bebas Biaya Pembayaran
              </option>

              <option value="FIXED_DISCOUNT">
                Diskon Nominal
              </option>

              <option value="PERCENT_DISCOUNT">
                Diskon Persen
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Produk
            </label>

            <select
              value={
                productId
              }
              disabled={loading}
              onChange={(
                event
              ) =>
                setProductId(
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">
                Semua Produk
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {product.name} —{" "}
                    {formatRupiah(
                      product.price
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          {type !==
            "FREE_PAYMENT_FEE" && (
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">
                {type ===
                "PERCENT_DISCOUNT"
                  ? "Diskon Persen *"
                  : "Diskon Nominal *"}
              </label>

              <input
                type="number"
                min="1"
                max={
                  type ===
                  "PERCENT_DISCOUNT"
                    ? 100
                    : undefined
                }
                value={
                  discountValue
                }
                disabled={loading}
                onChange={(
                  event
                ) =>
                  setDiscountValue(
                    event.target.value
                  )
                }
                placeholder={
                  type ===
                  "PERCENT_DISCOUNT"
                    ? "Contoh: 10"
                    : "Contoh: 5000"
                }
                className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          )}

          {type ===
            "PERCENT_DISCOUNT" && (
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">
                Maksimal Diskon
              </label>

              <input
                type="number"
                min="1"
                value={
                  maxDiscount
                }
                disabled={loading}
                onChange={(
                  event
                ) =>
                  setMaxDiscount(
                    event.target.value
                  )
                }
                placeholder="Contoh: 10000"
                className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Minimal Belanja
            </label>

            <input
              type="number"
              min="0"
              value={minOrder}
              disabled={loading}
              onChange={(
                event
              ) =>
                setMinOrder(
                  event.target.value
                )
              }
              placeholder="Kosong = tanpa minimum"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Margin Minimal Tersisa
            </label>

            <input
              type="number"
              min="0"
              value={
                minimumMargin
              }
              disabled={loading}
              onChange={(
                event
              ) =>
                setMinimumMargin(
                  event.target.value
                )
              }
              placeholder="0"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Kuota Total
            </label>

            <input
              type="number"
              min="1"
              value={maxUses}
              disabled={loading}
              onChange={(
                event
              ) =>
                setMaxUses(
                  event.target.value
                )
              }
              placeholder="Kosong = unlimited"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Maks. per Customer
            </label>

            <input
              type="number"
              min="1"
              value={
                maxUsesPerCustomer
              }
              disabled={loading}
              onChange={(
                event
              ) =>
                setMaxUsesPerCustomer(
                  event.target.value
                )
              }
              placeholder="Contoh: 1"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Minimal Transaksi Selesai
            </label>

            <input
              type="number"
              min="0"
              value={
                minCompletedOrders
              }
              disabled={
                loading ||
                firstOrderOnly
              }
              onChange={(
                event
              ) =>
                setMinCompletedOrders(
                  event.target.value
                )
              }
              placeholder={
                firstOrderOnly
                  ? "Tidak berlaku untuk order pertama"
                  : "Contoh: 5"
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Mulai Berlaku
            </label>

            <input
              type="datetime-local"
              value={startsAt}
              disabled={loading}
              onChange={(
                event
              ) =>
                setStartsAt(
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-300">
              Kedaluwarsa
            </label>

            <input
              type="datetime-local"
              value={expiresAt}
              disabled={loading}
              onChange={(
                event
              ) =>
                setExpiresAt(
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#060b16] p-4">
            <input
              type="checkbox"
              checked={
                firstOrderOnly
              }
              disabled={loading}
              onChange={(
                event
              ) => {
                const checked =
                  event.target
                    .checked;

                setFirstOrderOnly(
                  checked
                );

                if (checked) {
                  setMinCompletedOrders(
                    ""
                  );
                }
              }}
              className="h-4 w-4"
            />

            <div>
              <p className="text-sm font-bold text-white">
                Khusus Order Pertama
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Hanya customer yang belum pernah memiliki order PAID.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#060b16] p-4">
            <input
              type="checkbox"
              checked={active}
              disabled={loading}
              onChange={(
                event
              ) =>
                setActive(
                  event.target.checked
                )
              }
              className="h-4 w-4"
            />

            <div>
              <p className="text-sm font-bold text-white">
                Promo Aktif
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Promo langsung dapat digunakan jika semua syarat terpenuhi.
              </p>
            </div>
          </label>
        </div>

        {message && (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-400">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className={[
              "h-12 w-full rounded-xl text-sm font-black transition sm:w-auto sm:px-8",

              loading
                ? "cursor-not-allowed bg-blue-600/30 text-white/40"
                : "bg-blue-600 text-white hover:bg-blue-500",
            ].join(" ")}
          >
            {loading
              ? "Menyimpan..."
              : editingPromoId
                ? "Simpan Perubahan"
                : "Buat Promo"}
          </button>

          {editingPromoId && (
            <button
              type="button"
              disabled={loading}
              onClick={
                handleCancelEdit
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-8 text-sm font-black text-slate-300 transition hover:bg-white/10 sm:w-auto"
            >
              Batal Edit
            </button>
          )}
        </div>
      </form>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-black text-white">
            Daftar Promo
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Promo yang sudah tersimpan di database.
          </p>
        </div>

        {promos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-500">
            Belum ada promo.
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map(
              (promo) => {
                const isActionLoading =
                  actionPromoId ===
                  promo.id;

                const isEditing =
                  editingPromoId ===
                  promo.id;

                return (
                  <div
                    key={promo.id}
                    className={[
                      "rounded-xl border bg-[#060b16] p-4 transition",

                      isEditing
                        ? "border-blue-500/40 ring-1 ring-blue-500/20"
                        : "border-white/10",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black text-white">
                            {promo.code}
                          </p>

                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-[10px] font-black",

                              promo.active
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400",
                            ].join(" ")}
                          >
                            {promo.active
                              ? "AKTIF"
                              : "NONAKTIF"}
                          </span>

                          {isEditing && (
                            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-black text-blue-400">
                              SEDANG DIEDIT
                            </span>
                          )}
                        </div>

                        {promo.name && (
                          <p className="mt-2 text-sm font-semibold text-slate-300">
                            {promo.name}
                          </p>
                        )}

                        {promo.description && (
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {
                              promo.description
                            }
                          </p>
                        )}
                      </div>

                      <div className="lg:text-right">
                        <p className="text-xs text-slate-500">
                          Benefit
                        </p>

                        <p className="mt-1 text-sm font-black text-blue-400">
                          {getPromoBenefitText(
                            promo
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-slate-500">
                          Jenis
                        </p>

                        <p className="mt-1 font-bold text-slate-300">
                          {getPromoTypeLabel(
                            promo.type
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Produk
                        </p>

                        <p className="mt-1 font-bold text-slate-300">
                          {promo.product
                            ?.name ||
                            "Semua Produk"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Penggunaan
                        </p>

                        <p className="mt-1 font-bold text-slate-300">
                          {promo.usedCount}
                          {" / "}
                          {promo.maxUses ??
                            "∞"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Maks. Customer
                        </p>

                        <p className="mt-1 font-bold text-slate-300">
                          {promo.maxUsesPerCustomer ??
                            "∞"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Minimal Belanja
                        </p>

                        <p className="mt-1 font-bold text-slate-300">
                          {promo.minOrder !==
                          null
                            ? formatRupiah(
                                promo.minOrder
                              )
                            : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Margin Minimal
                        </p>

                        <p className="mt-1 font-bold text-slate-300">
                          {formatRupiah(
                            promo.minimumMargin
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Mulai
                        </p>

                        <p className="mt-1 font-bold text-slate-300">
                          {formatDate(
                            promo.startsAt
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Berakhir
                        </p>

                        <p className="mt-1 font-bold text-slate-300">
                          {formatDate(
                            promo.expiresAt
                          )}
                        </p>
                      </div>
                    </div>

                    {(promo.firstOrderOnly ||
                      promo.minCompletedOrders !==
                        null) && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                        {promo.firstOrderOnly && (
                          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-bold text-violet-400">
                            ORDER PERTAMA
                          </span>
                        )}

                        {promo.minCompletedOrders !==
                          null && (
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-400">
                            MIN{" "}
                            {
                              promo.minCompletedOrders
                            }{" "}
                            ORDER PAID
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        disabled={
                          loading ||
                          actionPromoId !==
                            null
                        }
                        onClick={() =>
                          handleEditPromo(
                            promo
                          )
                        }
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40",

                          isEditing
                            ? "border-blue-500/40 bg-blue-500/20 text-blue-300"
                            : "border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
                        ].join(" ")}
                      >
                        ✏️{" "}
                        {isEditing
                          ? "Sedang Edit"
                          : "Edit"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          loading ||
                          actionPromoId !==
                            null
                        }
                        onClick={() =>
                          handleTogglePromo(
                            promo
                          )
                        }
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40",

                          promo.active
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                        ].join(" ")}
                      >
                        {isActionLoading
                          ? "Memproses..."
                          : promo.active
                            ? "⏸ Nonaktifkan"
                            : "▶ Aktifkan"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          loading ||
                          actionPromoId !==
                            null
                        }
                        onClick={() =>
                          handleDeletePromo(
                            promo
                          )
                        }
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isActionLoading
                          ? "Memproses..."
                          : "🗑 Hapus"}
                      </button>
                    </div>

                    {promo.usedCount > 0 && (
                      <p className="mt-3 text-[11px] leading-5 text-slate-600">
                        Promo ini sudah pernah digunakan. Jika memiliki histori order, hapus permanen akan ditolak untuk menjaga data transaksi. Gunakan Nonaktifkan jika promo sudah tidak ingin dipakai.
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}