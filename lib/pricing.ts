const ZERO_PROFIT_MAX = 49;
const ONE_PERCENT_MAX = 70;

function roundUpRp10(value: number) {
  return Math.ceil(value / 10) * 10;
}

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

export function calculateSellingPrice({
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
   * PROFIT BENAR-BENAR 0%.
   *
   * Jangan dibulatkan karena
   * harga harus persis sama
   * dengan modal provider.
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