import crypto from "crypto";
import https from "https";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type DigiflazzTransactionData = {
  ref_id?: string;
  customer_no?: string;
  buyer_sku_code?: string;
  message?: string;
  status?: string;
  rc?: string;
  sn?: string;
  price?: number;
  buyer_last_saldo?: number;
};

type DigiflazzResponse = {
  data?: DigiflazzTransactionData;
};

export type DigiflazzProcessResult = {
  skipped: boolean;
  providerStatus: string;
  refId?: string;
  rc?: string;
  message?: string;
  sn?: string;
  price?: number;
};

/* Berlaku juga untuk pemanggilan dari Cron dan checker manual. */
export function assertPaymentModesMatch() {
  const midtransMode = process.env.MIDTRANS_IS_PRODUCTION?.trim();
  const digiflazzMode = process.env.DIGIFLAZZ_MODE?.trim().toLowerCase();

  const sandboxPair = midtransMode === "false" && digiflazzMode === "development";
  const productionPair = midtransMode === "true" && digiflazzMode === "production";

  if (!sandboxPair && !productionPair) {
    throw new Error(
      "Mode pembayaran tidak sesuai. Gunakan Midtrans false + Digiflazz development, atau Midtrans true + Digiflazz production."
    );
  }
}

function md5(value: string) {
  return crypto
    .createHash("md5")
    .update(value)
    .digest("hex");
}

function getDigiflazzConfig() {
  const username =
    process.env.DIGIFLAZZ_USERNAME?.trim();

  const mode =
    process.env.DIGIFLAZZ_MODE
      ?.trim()
      .toLowerCase() || "development";

  const developmentKey =
    process.env.DIGIFLAZZ_DEVELOPMENT_KEY?.trim();

  const productionKey =
    process.env.DIGIFLAZZ_PRODUCTION_KEY?.trim();

  const apiKey =
    mode === "production"
      ? productionKey
      : developmentKey;

  if (!username || !apiKey) {
    throw new Error(
      "Konfigurasi Digiflazz belum lengkap."
    );
  }

  return {
    username,
    apiKey,
    mode,
  };
}

function requestDigiflazz(
  payload: Record<string, unknown>
): Promise<DigiflazzResponse> {
  return new Promise(
    (resolve, reject) => {
      const body =
        JSON.stringify(payload);

      const req = https.request(
        {
          /*
           * Semua request Digiflazz
           * dikirim melalui VPS gateway
           * dengan Dedicated Public IPv4.
           *
           * Vercel
           *   ->
           * Gateway VPS
           *   ->
           * Digiflazz
           */

          hostname:
            "gateway.falintino.com",

          port: 443,

          path:
            "/v1/transaction",

          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Content-Length":
              Buffer.byteLength(
                body
              ),
          },
        },

        (res) => {
          let responseBody = "";

          res.on(
            "data",
            (chunk) => {
              responseBody += chunk;
            }
          );

          res.on(
            "end",
            () => {
              try {
                const parsed =
                  JSON.parse(
                    responseBody
                  ) as DigiflazzResponse;

                resolve(parsed);
              } catch {
                reject(
                  new Error(
                    `Respons Digiflazz tidak valid. HTTP ${
                      res.statusCode ??
                      "?"
                    }`
                  )
                );
              }
            }
          );
        }
      );

      req.on(
        "error",
        reject
      );

      req.setTimeout(
        30000,
        () => {
          req.destroy(
            new Error(
              "Timeout saat menghubungi Digiflazz."
            )
          );
        }
      );

      req.write(body);
      req.end();
    }
  );
}

function normalizeProviderStatus(
  status?: string
) {
  const normalized =
    String(status ?? "")
      .trim()
      .toLowerCase();

  if (
    normalized ===
    "sukses"
  ) {
    return "SUCCESS";
  }

  if (
    normalized ===
    "gagal"
  ) {
    return "FAILED";
  }

  return "PENDING";
}

function toJsonValue(
  value: unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value)
  ) as Prisma.InputJsonValue;
}

/*
 * Fungsi utama Digiflazz.
 *
 * Bisa dipakai untuk:
 *
 * 1. Mengirim transaksi pertama kali.
 * 2. Mengecek ulang transaksi PENDING.
 *
 * Keduanya selalu memakai ref_id
 * yang sama agar transaksi tidak
 * dibuat dua kali.
 */
export async function processDigiflazzOrder(
  orderId: string
): Promise<DigiflazzProcessResult> {
  // Periksa sebelum membaca/mengubah order atau menghubungi provider.
  assertPaymentModesMatch();

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        product: true,
      },
    });

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  /*
   * =====================================
   * PEMBAYARAN HARUS PAID
   * =====================================
   */

  if (
    order.paymentStatus !==
    "PAID"
  ) {
    return {
      skipped: true,

      providerStatus:
        order.providerStatus,

      message:
        "Pembayaran belum PAID.",
    };
  }

  /*
   * =====================================
   * SUCCESS ADALAH FINAL
   * =====================================
   *
   * Jangan pernah kirim ulang transaksi
   * yang sudah berhasil.
   */

  if (
    order.providerStatus ===
    "SUCCESS"
  ) {
    return {
      skipped: true,

      providerStatus:
        "SUCCESS",

      refId:
        order.providerRefId ??
        order.invoice,

      message:
        "Transaksi sudah sukses.",

      sn:
        order.providerSn ??
        undefined,

      rc:
        order.providerRc ??
        undefined,

      price:
        order.providerActualPrice ??
        undefined,
    };
  }

  /*
   * =====================================
   * FAILED JUGA FINAL
   * =====================================
   *
   * Jangan otomatis membuat transaksi
   * provider baru.
   *
   * Customer sudah membayar sehingga
   * kasus gagal harus ditangani dengan
   * aman.
   */

  if (
    order.providerStatus ===
    "FAILED"
  ) {
    return {
      skipped: true,

      providerStatus:
        "FAILED",

      refId:
        order.providerRefId ??
        order.invoice,

      message:
        order.providerMessage ??
        "Transaksi provider gagal.",

      rc:
        order.providerRc ??
        undefined,
    };
  }

  /*
   * =====================================
   * LOCK TRANSAKSI
   * =====================================
   *
   * Hanya satu proses yang boleh:
   *
   * PENDING -> PROCESSING
   *
   * Kalau webhook dan checker berjalan
   * bersamaan, hanya satu yang berhasil
   * mendapatkan lock.
   */

  const claimed =
    await prisma.order.updateMany({
      where: {
        id: order.id,

        providerStatus:
          "PENDING",
      },

      data: {
        providerStatus:
          "PROCESSING",

        providerUpdatedAt:
          new Date(),
      },
    });

  if (
    claimed.count === 0
  ) {
    const latest =
      await prisma.order.findUnique({
        where: {
          id: order.id,
        },

        select: {
          providerStatus:
            true,

          providerRefId:
            true,

          providerSn:
            true,

          providerRc:
            true,

          providerMessage:
            true,

          providerActualPrice:
            true,
        },
      });

    return {
      skipped: true,

      providerStatus:
        latest?.providerStatus ??
        order.providerStatus,

      refId:
        latest?.providerRefId ??
        undefined,

      sn:
        latest?.providerSn ??
        undefined,

      rc:
        latest?.providerRc ??
        undefined,

      message:
        latest?.providerMessage ??
        "Transaksi sedang diproses.",

      price:
        latest?.providerActualPrice ??
        undefined,
    };
  }

  /*
   * Ref ID harus selalu stabil.
   *
   * Kalau sebelumnya sudah pernah
   * mengirim transaksi, gunakan
   * providerRefId yang lama.
   *
   * Kalau belum, gunakan invoice.
   */

  const refId =
    order.providerRefId ||
    order.invoice;

  try {
    const {
      username,
      apiKey,
      mode,
    } =
      getDigiflazzConfig();

    /*
     * =====================================
     * HARGA MODAL PROVIDER
     * =====================================
     *
     * ORDER BARU:
     *
     * Gunakan providerPriceSnapshot
     * yang disimpan ketika order dibuat.
     *
     * Contoh:
     *
     * Saat order:
     * providerPriceSnapshot = 750
     *
     * Harga Product kemudian berubah:
     * providerPrice = 800
     *
     * max_price tetap 750.
     *
     * =====================================
     * ORDER LAMA
     * =====================================
     *
     * Order lama dibuat sebelum field
     * providerPriceSnapshot tersedia.
     *
     * Karena itu nilainya bisa null.
     *
     * Untuk kompatibilitas order lama,
     * fallback ke Product.providerPrice.
     *
     * Semua ORDER BARU tidak memakai
     * fallback karena snapshot selalu
     * disimpan oleh /api/orders.
     */

    const providerMaxPrice =
      order.providerPriceSnapshot ??
      order.product.providerPrice;

    if (
      !Number.isInteger(
        providerMaxPrice
      ) ||
      providerMaxPrice <= 0
    ) {
      throw new Error(
        "Harga modal provider pada order tidak valid."
      );
    }

    /*
     * Digiflazz:
     *
     * sign =
     * md5(username + apiKey + ref_id)
     */

    const sign =
      md5(
        `${username}${apiKey}${refId}`
      );

    /*
     * =====================================
     * PAYLOAD DIGIFLAZZ
     * =====================================
     */

    const payload: Record<
      string,
      unknown
    > = {
      username,

      buyer_sku_code:
        order.product
          .providerCode,

      customer_no:
        order.uid,

      ref_id:
        refId,

      sign,

      /*
       * Proteksi perubahan harga.
       *
       * Untuk order baru nilai ini
       * berasal dari snapshot pada saat
       * customer membuat order.
       */

      max_price:
        providerMaxPrice,
    };

    /*
     * Development:
     * testing = true
     *
     * Production:
     * transaksi sungguhan.
     */

    if (
      mode !==
      "production"
    ) {
      payload.testing =
        true;
    }

    /*
     * =====================================
     * REQUEST DIGIFLAZZ
     * =====================================
     */

    const response =
      await requestDigiflazz(
        payload
      );

    const data =
      response.data;

    /*
     * =====================================
     * RESPONSE TANPA DATA
     * =====================================
     *
     * Jangan anggap gagal final.
     *
     * Kembalikan ke PENDING supaya
     * checker dapat melakukan pengecekan
     * ulang menggunakan ref_id yang sama.
     */

    if (!data) {
      await prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          providerStatus:
            "PENDING",

          providerRefId:
            refId,

          providerMessage:
            "Digiflazz tidak memberikan data transaksi.",

          providerResponse:
            toJsonValue(
              response
            ),

          providerUpdatedAt:
            new Date(),
        },
      });

      throw new Error(
        "Digiflazz tidak memberikan data transaksi."
      );
    }

    /*
     * =====================================
     * NORMALISASI STATUS
     * =====================================
     */

    const providerStatus =
      normalizeProviderStatus(
        data.status
      );

    /*
     * =====================================
     * SIMPAN HASIL PROVIDER
     * =====================================
     */

    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        providerStatus,

        providerRefId:
          data.ref_id ||
          refId,

        providerSn:
          data.sn ||
          null,

        providerRc:
          data.rc ||
          null,

        providerMessage:
          data.message ||
          null,

        providerActualPrice:
          typeof data.price ===
          "number"
            ? data.price
            : null,

        providerLastBalance:
          typeof data.buyer_last_saldo ===
          "number"
            ? data.buyer_last_saldo
            : null,

        providerResponse:
          toJsonValue(
            response
          ),

        providerUpdatedAt:
          new Date(),
      },
    });

    /*
     * Jangan pernah log:
     *
     * - apiKey
     * - signature
     */

    console.log(
      "DIGIFLAZZ RESULT:",
      {
        invoice:
          order.invoice,

        refId:
          data.ref_id ||
          refId,

        sku:
          order.product
            .providerCode,

        status:
          data.status,

        rc:
          data.rc,

        message:
          data.message,

        sn:
          data.sn,

        price:
          data.price,

        /*
         * Aman untuk debugging.
         * Tidak mengandung credential.
         */

        providerMaxPrice,

        usedSnapshot:
          order.providerPriceSnapshot !==
          null,

        mode,
      }
    );

    return {
      skipped: false,

      providerStatus,

      refId:
        data.ref_id ||
        refId,

      rc:
        data.rc,

      message:
        data.message,

      sn:
        data.sn,

      price:
        data.price,
    };
  } catch (error) {
    /*
     * =====================================
     * NETWORK / UNKNOWN ERROR
     * =====================================
     *
     * Network error TIDAK berarti
     * transaksi Digiflazz gagal.
     *
     * Bisa saja request sudah diterima
     * Digiflazz tetapi koneksi terputus
     * sebelum respons diterima.
     *
     * Karena itu:
     *
     * PROCESSING -> PENDING
     *
     * sehingga checker dapat mengecek lagi
     * menggunakan ref_id yang SAMA.
     */

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menghubungi Digiflazz.";

    const latest =
      await prisma.order.findUnique({
        where: {
          id: order.id,
        },

        select: {
          providerStatus:
            true,
        },
      });

    if (
      latest?.providerStatus ===
      "PROCESSING"
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          providerStatus:
            "PENDING",

          providerRefId:
            refId,

          providerMessage:
            errorMessage,

          providerUpdatedAt:
            new Date(),
        },
      });
    }

    throw error;
  }
}
