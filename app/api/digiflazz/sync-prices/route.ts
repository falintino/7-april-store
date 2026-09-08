import crypto from "crypto";
import https from "https";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DigiflazzProduct = {
  product_name?: string;
  brand?: string;
  price?: number;
  buyer_sku_code?: string;
  buyer_product_status?: boolean;
  seller_product_status?: boolean;
};

type DigiflazzError = {
  rc?: string;
  message?: string;
};

type DigiflazzResponse = {
  data?:
    | DigiflazzProduct[]
    | DigiflazzError
    | unknown;

  message?: string;
};

function md5(value: string) {
  return crypto
    .createHash("md5")
    .update(value)
    .digest("hex");
}

function isAuthorized(request: Request) {
  const cronSecret =
    process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return false;
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

function requestPriceList(
  payload: Record<string, unknown>
): Promise<{
  statusCode: number;
  body: string;
}> {
  return new Promise(
    (resolve, reject) => {
      const body =
        JSON.stringify(payload);

      const req =
        https.request(
          {
            hostname:
              "gateway.falintino.com",

            port: 443,

            path:
              "/v1/price-list",

            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              "Content-Length":
                Buffer.byteLength(
                  body
                ),
            },
          },

          (res) => {
            let responseBody =
              "";

            res.setEncoding(
              "utf8"
            );

            res.on(
              "data",
              (chunk) => {
                responseBody +=
                  chunk;
              }
            );

            res.on(
              "end",
              () => {
                resolve({
                  statusCode:
                    res.statusCode ??
                    500,

                  body:
                    responseBody,
                });
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
              "Timeout saat mengambil pricelist Digiflazz."
            )
          );
        }
      );

      req.write(body);
      req.end();
    }
  );
}

async function syncPrices(
  request: Request
) {
  try {
    /*
     * Route sinkronisasi tidak boleh
     * dipanggil sembarang orang.
     */
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const username =
      process.env
        .DIGIFLAZZ_USERNAME
        ?.trim();

    const mode =
      process.env
        .DIGIFLAZZ_MODE
        ?.trim()
        .toLowerCase() ||
      "development";

    const developmentKey =
      process.env
        .DIGIFLAZZ_DEVELOPMENT_KEY
        ?.trim();

    const productionKey =
      process.env
        .DIGIFLAZZ_PRODUCTION_KEY
        ?.trim();

    const apiKey =
      mode === "production"
        ? productionKey
        : developmentKey;

    if (
      !username ||
      !apiKey
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Konfigurasi Digiflazz belum lengkap.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Ambil HANYA produk Free Fire
     * aktif yang sudah ada di database.
     *
     * Tidak membuat produk baru.
     */
    const localProducts =
      await prisma.product.findMany({
        where: {
          game:
            "Free Fire",

          active:
            true,
        },

        select: {
          id: true,
          name: true,
          sku: true,
          providerCode: true,

          /*
           * price tetap diambil supaya
           * bisa ditampilkan di hasil sync.
           *
           * PENTING:
           * price TIDAK akan diubah oleh
           * proses sinkronisasi Digiflazz.
           */
          price: true,

          /*
           * providerPrice adalah modal
           * terbaru dari Digiflazz.
           */
          providerPrice: true,
        },
      });

    if (
      localProducts.length === 0
    ) {
      return NextResponse.json({
        success: true,

        message:
          "Tidak ada produk Free Fire aktif untuk disinkronkan.",

        checked: 0,
        updated: 0,
        unchanged: 0,
        skipped: 0,
      });
    }

    const sign =
      md5(
        `${username}${apiKey}pricelist`
      );

    const result =
      await requestPriceList({
        cmd: "prepaid",
        username,
        sign,
      });

    let response:
      DigiflazzResponse;

    try {
      response =
        JSON.parse(
          result.body
        ) as DigiflazzResponse;
    } catch {
      return NextResponse.json(
        {
          success: false,

          message:
            "Respons pricelist Digiflazz bukan JSON.",

          httpStatus:
            result.statusCode,
        },
        {
          status: 502,
        }
      );
    }

    if (
      result.statusCode < 200 ||
      result.statusCode >= 300
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Digiflazz mengembalikan HTTP error.",

          httpStatus:
            result.statusCode,

          response,
        },
        {
          status: 502,
        }
      );
    }

    if (
      !Array.isArray(
        response.data
      )
    ) {
      const errorData =
        response.data &&
        typeof response.data ===
          "object"
          ? (response.data as DigiflazzError)
          : null;

      return NextResponse.json(
        {
          success: false,

          rc:
            errorData?.rc ??
            null,

          message:
            errorData
              ?.message ??
            response.message ??
            "Pricelist Digiflazz tidak tersedia.",
        },
        {
          status:
            errorData?.rc ===
            "83"
              ? 429
              : 502,
        }
      );
    }

    const priceList =
      response.data as DigiflazzProduct[];

    /*
     * Buat lookup berdasarkan
     * buyer_sku_code.
     */
    const providerMap =
      new Map<
        string,
        DigiflazzProduct
      >();

    for (
      const product
      of priceList
    ) {
      const providerCode =
        String(
          product
            .buyer_sku_code ??
            ""
        )
          .trim()
          .toLowerCase();

      if (!providerCode) {
        continue;
      }

      providerMap.set(
        providerCode,
        product
      );
    }

    /*
     * Hasil sinkronisasi.
     *
     * oldPrice / newPrice di sini
     * mengacu pada MODAL PROVIDER,
     * bukan harga jual website.
     *
     * sellingPrice adalah harga
     * yang dilihat customer.
     */
    const results: Array<{
      name: string;
      providerCode: string;

      oldPrice: number;
      newPrice?: number;

      sellingPrice: number;

      status:
        | "UPDATED"
        | "UNCHANGED"
        | "SKIPPED";

      reason?: string;
    }> = [];

    for (
      const product
      of localProducts
    ) {
      const code =
        product.providerCode
          .trim()
          .toLowerCase();

      const providerProduct =
        providerMap.get(
          code
        );

      if (!providerProduct) {
        results.push({
          name:
            product.name,

          providerCode:
            product.providerCode,

          oldPrice:
            product.providerPrice,

          sellingPrice:
            product.price,

          status:
            "SKIPPED",

          reason:
            "SKU tidak ditemukan di pricelist Digiflazz.",
        });

        continue;
      }

      const providerActive =
        providerProduct
          .buyer_product_status ===
          true &&
        providerProduct
          .seller_product_status ===
          true;

      if (!providerActive) {
        results.push({
          name:
            product.name,

          providerCode:
            product.providerCode,

          oldPrice:
            product.providerPrice,

          sellingPrice:
            product.price,

          status:
            "SKIPPED",

          reason:
            "Produk Digiflazz sedang tidak aktif.",
        });

        continue;
      }

      const newPrice =
        Number(
          providerProduct.price ??
            0
        );

      if (
        !Number.isInteger(
          newPrice
        ) ||
        newPrice <= 0
      ) {
        results.push({
          name:
            product.name,

          providerCode:
            product.providerCode,

          oldPrice:
            product.providerPrice,

          sellingPrice:
            product.price,

          status:
            "SKIPPED",

          reason:
            "Harga Digiflazz tidak valid.",
        });

        continue;
      }

      /*
       * ==================================================
       * PENTING:
       * ==================================================
       *
       * Sinkronisasi Digiflazz HANYA membandingkan
       * providerPrice.
       *
       * product.price adalah HARGA JUAL TOKO.
       *
       * Jadi contoh:
       *
       * providerPrice = 750
       * price         = 780
       *
       * Jika Digiflazz masih menjual Rp750,
       * status tetap UNCHANGED.
       *
       * Harga jual Rp780 TIDAK dianggap sebagai
       * perbedaan yang perlu diperbaiki.
       */
      if (
        product.providerPrice ===
          newPrice
      ) {
        results.push({
          name:
            product.name,

          providerCode:
            product.providerCode,

          oldPrice:
            product.providerPrice,

          newPrice,

          sellingPrice:
            product.price,

          status:
            "UNCHANGED",
        });

        continue;
      }

      /*
       * ==================================================
       * STRATEGI HARGA TOKO
       * ==================================================
       *
       * providerPrice =
       * modal Digiflazz.
       *
       * price =
       * harga jual 7 April Store.
       *
       * Fee pembayaran =
       * dihitung terpisah saat checkout.
       *
       * Promo =
       * dihitung terpisah oleh sistem promo.
       *
       * Karena itu sinkronisasi provider
       * DILARANG mengubah product.price.
       *
       * Contoh:
       *
       * Sebelum:
       *
       * providerPrice = 750
       * price         = 780
       *
       * Digiflazz naik menjadi:
       *
       * providerPrice = 760
       *
       * Setelah sync:
       *
       * providerPrice = 760
       * price         = 780
       *
       * Dengan demikian harga jual toko
       * tetap berada di bawah kendali kita.
       */
      await prisma.product.update({
        where: {
          id:
            product.id,
        },

        data: {
          /*
           * HANYA update modal provider.
           *
           * Jangan tambahkan:
           *
           * price: newPrice
           *
           * karena itu akan menimpa
           * harga jual website.
           */
          providerPrice:
            newPrice,
        },
      });

      results.push({
        name:
          product.name,

        providerCode:
          product.providerCode,

        oldPrice:
          product.providerPrice,

        newPrice,

        sellingPrice:
          product.price,

        status:
          "UPDATED",
      });
    }

    const updated =
      results.filter(
        (item) =>
          item.status ===
          "UPDATED"
      ).length;

    const unchanged =
      results.filter(
        (item) =>
          item.status ===
          "UNCHANGED"
      ).length;

    const skipped =
      results.filter(
        (item) =>
          item.status ===
          "SKIPPED"
      ).length;

    return NextResponse.json({
      success: true,

      mode,

      gateway:
        "gateway.falintino.com",

      checked:
        localProducts.length,

      updated,
      unchanged,
      skipped,

      /*
       * results sekarang memperlihatkan:
       *
       * oldPrice     = modal provider sebelumnya
       * newPrice     = modal provider terbaru
       * sellingPrice = harga jual website
       *
       * Jadi kita bisa memastikan bahwa
       * harga jual tidak ikut berubah.
       */
      results,
    });
  } catch (error) {
    console.error(
      "DIGIFLAZZ PRICE SYNC ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat sinkronisasi harga Digiflazz.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * Bisa dipanggil otomatis.
 */
export async function GET(
  request: Request
) {
  return syncPrices(request);
}

/*
 * Bisa juga dites manual
 * menggunakan PowerShell.
 */
export async function POST(
  request: Request
) {
  return syncPrices(request);
}