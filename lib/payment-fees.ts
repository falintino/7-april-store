const QRIS_FEE_RATE = 0.007;

/*
 * 1–49 Diamond:
 * tidak ada fee pembayaran.
 *
 * 50 Diamond ke atas:
 * customer dikenakan fee QRIS 0,7%
 * seperti model Banana.
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
   * Membership / produk tanpa jumlah
   * Diamond tidak dikenakan fee di sini.
   */
  if (
    diamondAmount === null
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