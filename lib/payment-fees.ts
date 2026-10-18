const QRIS_FEE_RATE = 0.007;

/*
 * 1–49 Diamond:
 * biaya QRIS ditanggung toko (Rp0).
 *
 * 50 Diamond ke atas dan Membership:
 * biaya QRIS 0,7% ditambahkan ke total
 * yang dibayar pelanggan.
 */

export function getPaymentFee({
  productPrice,
  diamondAmount,
  paymentMethod,
}: {
  productPrice: number;
  diamondAmount: number | null;
  paymentMethod: string;
}) {
  if (
    !Number.isInteger(productPrice) ||
    productPrice <= 0
  ) {
    return 0;
  }

  /*
   * Saat ini fee khusus kita hanya
   * diterapkan untuk QRIS.
   */
  if (
    paymentMethod !== "qris"
  ) {
    return 0;
  }

  /*
   * 1–49 DM:
   * TIDAK ADA FEE.
   */
  if (
    diamondAmount !== null &&
    diamondAmount <= 49
  ) {
    return 0;
  }

  /*
   * 50 DM ke atas:
   * fee = 0,7% dari harga produk.
   *
   * Dibulatkan ke bawah agar pola
   * perhitungannya konsisten.
   */
  return Math.floor(
    productPrice *
      QRIS_FEE_RATE,
  );
}

export function getCustomerTotal({
  productPrice,
  diamondAmount,
  paymentMethod,
}: {
  productPrice: number;
  diamondAmount: number | null;
  paymentMethod: string;
}) {
  const paymentFee =
    getPaymentFee({
      productPrice,
      diamondAmount,
      paymentMethod,
    });

  return {
    paymentFee,

    customerTotal:
      productPrice +
      paymentFee,
  };
}