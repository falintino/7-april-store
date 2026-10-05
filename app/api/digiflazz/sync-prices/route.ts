import crypto from "crypto";
import https from "https";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  calculateSellingPrice,
} from "@/lib/pricing";

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
      "authorization",
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

function requestPriceList(
  payload: Record<string, unknown>,
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
                  body,
                ),
            },
          },

          (res) => {
            let responseBody =
              "";

            res.setEncoding(
              "utf8",
            );

            res.on(
              "data",
              (chunk) => {
                responseBody +=
                  chunk;
              },
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
              },
            );
          },
        );

      req.on(
        "error",
        reject,
      );

      req.setTimeout(
        30000,
        () => {
          req.destroy(
            new Error(
              "Timeout saat mengambil pricelist Digiflazz.",
            ),
          );
        },
      );

      req.write(body);
      req.end();
    },
  );
}

async function syncPrices(
  request: Request,
) {
  try {
    /*
     * =========================================
     * AUTHORIZATION
     * =========================================
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
        },
      );
    }

    /*
     * =========================================
     * DIGIFLAZZ CONFIG
     * =========================================
     */

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
        },
      );
    }

    /*
     * =========================================
     * AMBIL PRODUK FREE FIRE AKTIF
     * =========================================
     *
     * Produk lokal tidak dibuat baru.
     *
     * Harga supplier dan harga jual
     * akan disinkronkan berdasarkan
     * pricing engine.
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

          price: true,

          providerPrice: true,
        },
      });

    if (
      localProducts.length ===
      0
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

    /*
     * =========================================
     * SIGN PRICELIST
     * =========================================
     *
     * md5(username + apiKey + pricelist)
     */

    const sign =
      md5(
        `${username}${apiKey}pricelist`,
      );

    /*
     * =========================================
     * REQUEST KE GATEWAY
     * =========================================
     */

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
          result.body,
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
        },
      );
    }

    /*
     * =========================================
     * HTTP ERROR
     * =========================================
     */

    if (
      result.statusCode <
        200 ||
      result.statusCode >=
        300
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
        },
      );
    }

    /*
     * =========================================
     * DIGIFLAZZ ERROR RESPONSE
     * =========================================
     */

    if (
      !Array.isArray(
        response.data,
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
            errorData?.message ??
            response.message ??
            "Pricelist Digiflazz tidak tersedia.",
        },
        {
          status:
            errorData?.rc ===
            "83"
              ? 429
              : 502,
        },
      );
    }

    const priceList =
      response.data as DigiflazzProduct[];

    /*
     * =========================================
     * LOOKUP SKU PROVIDER
     * =========================================
     */

    const providerMap =
      new Map<
        string,
        DigiflazzProduct
      >();

    for (
      const providerProduct
      of priceList
    ) {
      const providerCode =
        String(
          providerProduct
            .buyer_sku_code ??
            "",
        )
          .trim()
          .toLowerCase();

      if (!providerCode) {
        continue;
      }

      providerMap.set(
        providerCode,
        providerProduct,
      );
    }

    /*
     * =========================================
     * HASIL
     * =========================================
     */

    const results: Array<{
      name: string;

      providerCode: string;

      oldProviderPrice: number;

      newProviderPrice?: number;

      oldSellingPrice: number;

      newSellingPrice?: number;

      profitPercent?: number;

      status:
        | "UPDATED"
        | "UNCHANGED"
        | "SKIPPED";

      reason?: string;
    }> = [];

    /*
     * =========================================
     * SYNC SATU PER SATU
     * =========================================
     */

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
          code,
        );

      /*
       * SKU TIDAK DITEMUKAN
       */

      if (!providerProduct) {
        results.push({
          name:
            product.name,

          providerCode:
            product.providerCode,

          oldProviderPrice:
            product.providerPrice,

          oldSellingPrice:
            product.price,

          status:
            "SKIPPED",

          reason:
            "SKU tidak ditemukan di pricelist Digiflazz.",
        });

        continue;
      }

      /*
       * PRODUK PROVIDER TIDAK AKTIF
       */

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

          oldProviderPrice:
            product.providerPrice,

          oldSellingPrice:
            product.price,

          status:
            "SKIPPED",

          reason:
            "Produk Digiflazz sedang tidak aktif.",
        });

        continue;
      }

      /*
       * =========================================
       * HARGA PROVIDER TERBARU
       * =========================================
       */

      const newPrice =
        Number(
          providerProduct
            .price ??
            0,
        );

      if (
        !Number.isInteger(
          newPrice,
        ) ||
        newPrice <= 0
      ) {
        results.push({
          name:
            product.name,

          providerCode:
            product.providerCode,

          oldProviderPrice:
            product.providerPrice,

          oldSellingPrice:
            product.price,

          status:
            "SKIPPED",

          reason:
            "Harga Digiflazz tidak valid.",
        });

        continue;
      }

      /*
       * =========================================
       * HITUNG HARGA JUAL BARU
       * =========================================
       *
       * 1-49 DM:
       *   profit 0%
       *
       * 50-70 DM:
       *   profit 1%
       *
       * 71+ DM:
       *   profit 3%
       *
       * Membership:
       *   profit 3%
       */

      const newSellingPrice =
        calculateSellingPrice({
          name:
            product.name,

          sku:
            product.sku,

          providerPrice:
            newPrice,
        });

      /*
       * =========================================
       * HITUNG PERSENTASE PROFIT UNTUK HASIL
       * =========================================
       *
       * Hanya untuk informasi dashboard/log.
       */

      const profitPercent =
        newPrice > 0
          ? Number(
              (
                ((newSellingPrice -
                  newPrice) /
                  newPrice) *
                100
              ).toFixed(
                2,
              ),
            )
          : 0;

      /*
       * =========================================
       * TIDAK ADA PERUBAHAN
       * =========================================
       */

      if (
        product.providerPrice ===
          newPrice &&
        product.price ===
          newSellingPrice
      ) {
        results.push({
          name:
            product.name,

          providerCode:
            product.providerCode,

          oldProviderPrice:
            product.providerPrice,

          newProviderPrice:
            newPrice,

          oldSellingPrice:
            product.price,

          newSellingPrice:
            newSellingPrice,

          profitPercent,

          status:
            "UNCHANGED",
        });

        continue;
      }

      /*
       * =========================================
       * UPDATE DATABASE
       * =========================================
       *
       * providerPrice:
       *   modal terbaru Digiflazz
       *
       * price:
       *   harga jual terbaru berdasarkan
       *   pricing engine
       */

      await prisma.product.update({
        where: {
          id:
            product.id,
        },

        data: {
          providerPrice:
            newPrice,

          price:
            newSellingPrice,
        },
      });

      results.push({
        name:
          product.name,

        providerCode:
          product.providerCode,

        oldProviderPrice:
          product.providerPrice,

        newProviderPrice:
          newPrice,

        oldSellingPrice:
          product.price,

        newSellingPrice:
          newSellingPrice,

        profitPercent,

        status:
          "UPDATED",
      });
    }

    /*
     * =========================================
     * STATISTIK
     * =========================================
     */

    const updated =
      results.filter(
        (item) =>
          item.status ===
          "UPDATED",
      ).length;

    const unchanged =
      results.filter(
        (item) =>
          item.status ===
          "UNCHANGED",
      ).length;

    const skipped =
      results.filter(
        (item) =>
          item.status ===
          "SKIPPED",
      ).length;

    /*
     * =========================================
     * RESPONSE
     * =========================================
     */

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

      profitRules: {
        "1-49 DM":
          "0%",

        "50-70 DM":
          "1%",

        "71+ DM":
          "3%",

        membership:
          "3%",
      },

      results,
    });
  } catch (error) {
    console.error(
      "DIGIFLAZZ PRICE SYNC ERROR:",
      error,
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
      },
    );
  }
}

/*
 * =========================================
 * GET
 * =========================================
 */

export async function GET(
  request: Request,
) {
  return syncPrices(request);
}

/*
 * =========================================
 * POST
 * =========================================
 */

export async function POST(
  request: Request,
) {
  return syncPrices(request);
}