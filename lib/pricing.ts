const ZERO_PROFIT_MAX = 49;
const ONE_PERCENT_MAX = 70;

/*
 * Target harga kompetitif berdasarkan harga Banana Store
 * yang terakhir kita gunakan sebagai acuan.
 *
 * Target dibuat sedikit di bawah Banana agar 7 April Store
 * tetap terlihat kompetitif, tetapi tidak boleh membuat
 * harga jual berada di bawah modal provider.
 *
 * Nilai di sini adalah harga PRODUK, belum termasuk
 * biaya QRIS. Biaya QRIS tetap dihitung terpisah.
 */
const COMPETITOR_TARGET_PRICES: Record<number, number> = {
  5: 737,
  10: 1480,
  12: 1650,
  20: 3060,
  25: 3830,
  30: 4590,

  50: 6090,
  55: 6860,
  70: 8190,
  75: 8960,
  80: 9720,
  90: 11260,
  100: 12190,
  120: 15260,
  140: 16380,
  145: 17150,
  150: 17920,
  160: 19450,
  170: 20990,
  190: 22480,

  210: 24580,
  280: 32770,
  300: 35840,
  355: 44030,
  375: 44030,
  405: 47060,
  425: 49160,
  475: 55260,
  495: 57350,
  500: 58120,
  510: 59650,
  545: 63450,
  565: 66310,
  635: 74510,
  720: 81910,
  725: 82670,
  740: 84980,
  770: 88000,
  790: 90100,
  860: 98290,
  930: 106490,
  1000: 114680,
  1075: 122870,
  1440: 163820,
  1450: 165350,
  2000: 229370,
  2160: 245730,
  7290: 829660,
};

function roundUpRp10(value: number) {
  return Math.ceil(value / 10) * 10;
}

function getCompetitorTargetPrice(
  diamondAmount: number | null,
) {
  if (diamondAmount === null) {
    return null;
  }

  return (
    COMPETITOR_TARGET_PRICES[
      diamondAmount
    ] ?? null
  );
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
 * Aturan profit fallback:
 *
 * 1–49 DM   = 0%
 * 50–70 DM  = 1%
 * 71+ DM    = 3%
 *
 * Target kompetitor diutamakan ketika tersedia.
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
 * Hitung harga jual:
 *
 * 1. Untuk nominal yang punya target Banana:
 *    gunakan target kompetitif.
 *
 * 2. Tetapi HARGA TIDAK BOLEH DI BAWAH MODAL
 *    provider. Jadi kalau harga kompetitor lebih
 *    murah daripada modal kita, otomatis gunakan
 *    minimal harga modal.
 *
 * 3. Untuk nominal yang belum punya target:
 *    gunakan aturan margin lama sebagai fallback.
 *
 * Membership tetap menggunakan margin 3%.
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
   * tetap 3%.
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
   * Target kompetitor.
   */
  const competitorTarget =
    getCompetitorTargetPrice(
      diamondAmount,
    );

  if (competitorTarget !== null) {
    /*
     * Jangan pernah menjual di bawah modal.
     */
    return Math.max(
      providerPrice,
      competitorTarget,
    );
  }

  /*
   * 1–49 DM:
   * 0% profit sebagai fallback.
   */
  if (
    diamondAmount !== null &&
    diamondAmount <= ZERO_PROFIT_MAX
  ) {
    return providerPrice;
  }

  /*
   * 50–70 DM:
   * profit 1% sebagai fallback.
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
   * profit 3% sebagai fallback.
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
 * Contoh:
 *
 * 70 DM  = 8.190
 * 75 DM  = 8.960
 *
 * Harga tidak boleh turun.
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
