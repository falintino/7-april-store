const ZERO_PROFIT_MAX = 49;
const ONE_PERCENT_MAX = 70;

/*
 * Target harga kompetitif berdasarkan harga Banana Store.
 * Untuk nominal 5–50 DM, harga lama dipertahankan. Nominal di atasnya
 * menggunakan target yang bervariasi Rp70–Rp200 lebih murah dari Banana.
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
  375: 43194,
  405: 46187,
  425: 48261,
  475: 54267,
  495: 56317,
  500: 57113,
  510: 58514,
  545: 62289,
  565: 65112,
  635: 73256,
  720: 80505,
  725: 81308,
  740: 83421,
  770: 86478,
  790: 88548,
  860: 96694,
  930: 104670,
  1000: 112796,
  1075: 120890,
  1440: 161143,
  1450: 162680,
  2000: 225626,
  2160: 241856,
  2020: 228666,
  2880: 322383,
  3600: 403103,
  4320: 483700,
  6480: 768044,
  6550: 774283,
  6900: 816506,
  7290: 807568,
  7295: 808000,
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
   * Harga jual dikunci mengikuti harga resmi 7 April Store.
   * Sinkronisasi hanya memperbarui providerPrice, bukan harga jual.
   */
  const fixedMembershipPrices: Record<string, number> = {
    FF_MEMBERSHIP_WEEKLY: 25160,
    FF_MEMBERSHIP_MONTHLY: 75410,
  };

  if (fixedMembershipPrices[sku] !== undefined) {
    return fixedMembershipPrices[sku];
  }

  if (sku.startsWith("FF_MEMBERSHIP_")) {
    return roundUpRp10(providerPrice * 1.03);
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
