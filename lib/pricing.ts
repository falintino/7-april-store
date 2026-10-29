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
  5: 719,
  10: 1449,
  12: 1619,
  20: 2979,
  25: 3729,
  30: 4479,
  50: 5929,
  55: 6659,
  70: 8049,
  75: 8799,
  80: 9549,
  90: 11049,
  100: 11879,
  120: 14859,
  140: 16129,
  145: 16879,
  150: 17599,
  160: 19099,
  170: 20599,
  190: 22049,
  210: 24199,
  250: 30547,
  280: 32259,
  300: 35249,
  355: 40299,
  360: 41079,
  375: 43252,
  405: 46205,
  425: 48333,
  475: 54273,
  495: 56390,
  500: 57147,
  510: 58640,
  545: 62340,
  565: 65217,
  635: 73285,
  720: 80573,
  725: 81320,
  740: 83560,
  770: 86513,
  790: 88641,
  860: 96708,
  930: 104776,
  1000: 112843,
  1075: 120908,
  1440: 161216,
  1450: 162709,
  2000: 225755,
  2160: 241858,
  2020: 228742,
  2880: 322501,
  3600: 403144,
  4320: 483787,
  6480: 768044,
  6550: 774283,
  6900: 816506,
  7290: 807624,
  7295: 860591,
  7310: 862954,
  7340: 866137,
  7360: 868405,
  7430: 877007,
  7645: 902813,
  7650: 903601,
  8010: 945823,
  9290: 1099084,
  9800: 1158605,
  14580: 1758000,
  36500: 4311696,
  37050: 4378809,
  73100: 8637586,
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
    /\b(\d{1,5})\b/,
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
    // Harga target yang ditetapkan pemilik toko dipakai apa adanya,
    // meskipun untuk nominal promo ini margin menjadi negatif.
    return competitorTarget;
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

/**
 * Harga jual efektif untuk nominal yang ditetapkan secara khusus.
 * Harga target hanya digunakan jika tidak berada di bawah modal provider.
 */
export function getEffectiveSellingPrice({
  name,
  sku,
  providerPrice,
  fallbackPrice,
}: {
  name: string;
  sku: string;
  providerPrice: number;
  fallbackPrice: number;
}) {
  const amount = getDiamondAmount(name, sku);
  const target = amount === null ? null : COMPETITOR_TARGET_PRICES[amount];

  if (target === undefined || target === null) {
    return fallbackPrice;
  }

  // Harga promo yang ditetapkan pemilik toko digunakan apa adanya.
  // Nominal tertentu boleh disubsidi toko meskipun di bawah modal provider.
  return target;
}
