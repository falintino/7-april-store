const ZERO_PROFIT_MAX = 49;
const ONE_PERCENT_MAX = 70;

function roundUpRp10(value: number) {
  return Math.ceil(value / 10) * 10;
}

/*
 * Ambil jumlah Diamond dari nama / SKU.
 *
 * Contoh:
 * 5 Diamond  -> 5
 * 50 Diamond -> 50
 * FF500      -> 500
 */
export function getDiamondAmount(
  name: string,
  sku: string,
) {
  const match = `${name} ${sku}`.match(
    /\b(\d{1,4})\b/,
  );

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  return Number.isInteger(amount) &&
    amount > 0
    ? amount
    : null;
}

/*
 * Aturan profit:
 *
 * 1–49 DM   = 0%
 * 50–70 DM  = 1%
 * 71+ DM    = 3%
 *
 * Membership = 3%
 */
export function getProfitPercent(
  diamondAmount: number | null,
) {
  if (
    diamondAmount !== null &&
    diamondAmount <= ZERO_PROFIT_MAX
  ) {
    return 0;
  }

  if (
    diamondAmount !== null &&
    diamondAmount <= ONE_PERCENT_MAX
  ) {
    return 1;
  }

  return 3;
}

/*
 * Hitung harga dasar dari modal Digiflazz.
 *
 * Catatan:
 * Fungsi ini TIDAK menentukan apakah
 * harga harus lebih tinggi dari nominal
 * sebelumnya.
 *
 * Aturan harga berjenjang akan dilakukan
 * oleh sync-prices setelah semua produk
 * diurutkan berdasarkan jumlah Diamond.
 */
export function calculateBaseSellingPrice({
  name,
  sku,
  providerPrice,
}: {
  name: string;
  sku: string;
  providerPrice: number;
}) {
  if (
    !Number.isInteger(providerPrice) ||
    providerPrice <= 0
  ) {
    throw new Error(
      "Harga provider tidak valid.",
    );
  }

  /*
   * Membership:
   * profit 3%.
   */
  if (
    sku.startsWith(
      "FF_MEMBERSHIP_",
    )
  ) {
    return roundUpRp10(
      providerPrice * 1.03,
    );
  }

  const diamondAmount =
    getDiamondAmount(
      name,
      sku,
    );

  /*
   * 1–49 DM:
   * benar-benar 0% profit.
   */
  if (
    diamondAmount !== null &&
    diamondAmount <= ZERO_PROFIT_MAX
  ) {
    return providerPrice;
  }

  /*
   * 50–70 DM:
   * profit 1%.
   */
  if (
    diamondAmount !== null &&
    diamondAmount <= ONE_PERCENT_MAX
  ) {
    return roundUpRp10(
      providerPrice * 1.01,
    );
  }

  /*
   * 71 DM ke atas:
   * profit 3%.
   */
  return roundUpRp10(
    providerPrice * 1.03,
  );
}

/*
 * Menjamin harga nominal berikutnya
 * tidak lebih murah dari nominal
 * Diamond yang lebih kecil.
 *
 * Contoh harga dasar:
 *
 * 70 DM  = 7.070
 * 75 DM  = 6.180
 *
 * Fungsi ini akan membuat:
 *
 * 75 DM >= 7.070
 *
 * sehingga harga tidak turun.
 *
 * Nilai ini DIKUNCI ke kelipatan Rp10
 * supaya tampilan tetap rapi.
 */
export function enforceMinimumSellingPrice({
  calculatedPrice,
  previousSellingPrice,
}: {
  calculatedPrice: number;
  previousSellingPrice: number | null;
}) {
  if (
    !Number.isInteger(calculatedPrice) ||
    calculatedPrice <= 0
  ) {
    throw new Error(
      "Harga jual hasil perhitungan tidak valid.",
    );
  }

  if (
    previousSellingPrice === null
  ) {
    return calculatedPrice;
  }

  if (
    !Number.isInteger(
      previousSellingPrice,
    ) ||
    previousSellingPrice <= 0
  ) {
    return calculatedPrice;
  }

  return Math.max(
    calculatedPrice,
    previousSellingPrice,
  );
}

/*
 * Backward compatibility:
 *
 * File lain yang sebelumnya memakai
 * calculateSellingPrice tetap bisa
 * menggunakannya.
 */
export function calculateSellingPrice({
  name,
  sku,
  providerPrice,
}: {
  name: string;
  sku: string;
  providerPrice: number;
}) {
  return calculateBaseSellingPrice({
    name,
    sku,
    providerPrice,
  });
}