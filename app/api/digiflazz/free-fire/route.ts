import { NextResponse } from "next/server";
import { createHash } from "crypto";
import https from "https";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DigiflazzProduct = {
  product_name?: string;
  category?: string;
  brand?: string;
  type?: string;
  seller_name?: string;
  price?: number;
  buyer_sku_code?: string;
  buyer_product_status?: boolean;
  seller_product_status?: boolean;
  unlimited_stock?: boolean;
  stock?: number;
  multi?: boolean;
  start_cut_off?: string;
  end_cut_off?: string;
  desc?: string;
};

type DigiflazzErrorData = {
  rc?: string;
  message?: string;
};

type DigiflazzResponse = {
  data?:
    | DigiflazzProduct[]
    | DigiflazzErrorData
    | unknown;

  message?: string;
};

function postDigiflazz(
  body: Record<string, unknown>
): Promise<{
  statusCode: number;
  body: string;
}> {
  return new Promise(
    (resolve, reject) => {
      const payload =
        JSON.stringify(body);

      const request =
        https.request(
          {
            /*
             * Semua request Digiflazz
             * harus melewati VPS gateway.
             *
             * Vercel
             *   ↓
             * gateway.falintino.com
             *   ↓
             * api.digiflazz.com
             *
             * Dengan begitu IP keluar
             * ke Digiflazz tetap memakai
             * Dedicated Public IPv4 VPS.
             */
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
                  payload
                ),

              "User-Agent":
                "7-April-Store/1.0",
            },

            timeout: 15000,
          },

          (response) => {
            let rawData = "";

            response.setEncoding(
              "utf8"
            );

            response.on(
              "data",
              (chunk) => {
                rawData += chunk;
              }
            );

            response.on(
              "end",
              () => {
                resolve({
                  statusCode:
                    response.statusCode ??
                    500,

                  body:
                    rawData,
                });
              }
            );
          }
        );

      request.on(
        "timeout",
        () => {
          request.destroy(
            new Error(
              "Koneksi ke Digiflazz timeout."
            )
          );
        }
      );

      request.on(
        "error",
        (error) => {
          reject(error);
        }
      );

      request.write(payload);
      request.end();
    }
  );
}

function getDiamondAmount(
  productName?: string
) {
  const match =
    String(
      productName ?? ""
    ).match(/(\d+)/);

  return match
    ? Number(match[1])
    : 999999;
}

export async function GET() {
  try {
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

    /*
     * ===========================
     * VALIDASI ENV
     * ===========================
     */
    if (!username) {
      return NextResponse.json(
        {
          success: false,

          stage: "ENV",

          message:
            "DIGIFLAZZ_USERNAME belum tersedia.",
        },
        {
          status: 500,
        }
      );
    }

    const apiKey =
      mode === "production"
        ? productionKey
        : developmentKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,

          stage: "ENV",

          mode,

          message:
            mode === "production"
              ? "DIGIFLAZZ_PRODUCTION_KEY belum tersedia."
              : "DIGIFLAZZ_DEVELOPMENT_KEY belum tersedia.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Digiflazz Price List:
     *
     * sign =
     * md5(username + apiKey + "pricelist")
     */
    const sign =
      createHash("md5")
        .update(
          `${username}${apiKey}pricelist`
        )
        .digest("hex");

    /*
     * ===========================
     * REQUEST PRICE LIST
     * ===========================
     */
    const result =
      await postDigiflazz({
        cmd: "prepaid",
        username,
        sign,
      });

    let data:
      DigiflazzResponse;

    try {
      data =
        JSON.parse(
          result.body
        ) as DigiflazzResponse;
    } catch {
      return NextResponse.json(
        {
          success: false,

          stage:
            "PARSE_RESPONSE",

          httpStatus:
            result.statusCode,

          message:
            "Response Digiflazz bukan JSON.",

          responsePreview:
            result.body.slice(
              0,
              500
            ),
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ===========================
     * HTTP ERROR
     * ===========================
     */
    if (
      result.statusCode < 200 ||
      result.statusCode >= 300
    ) {
      return NextResponse.json(
        {
          success: false,

          stage:
            "DIGIFLAZZ_HTTP",

          httpStatus:
            result.statusCode,

          mode,

          gateway:
            "gateway.falintino.com",

          data,
        },
        {
          status:
            result.statusCode,
        }
      );
    }

    /*
     * Price list normal:
     *
     * data.data = ARRAY
     *
     * Kalau error seperti rc 83:
     *
     * data.data = OBJECT
     */
    if (
      !Array.isArray(
        data.data
      )
    ) {
      const digiflazzError =
        data.data &&
        typeof data.data ===
          "object"
          ? (data.data as DigiflazzErrorData)
          : null;

      return NextResponse.json(
        {
          success: false,

          stage:
            "DIGIFLAZZ_API",

          mode,

          gateway:
            "gateway.falintino.com",

          rc:
            digiflazzError
              ?.rc ??
            null,

          message:
            digiflazzError
              ?.message ??
            data.message ??
            "Digiflazz tidak mengembalikan daftar pricelist.",

          hint:
            digiflazzError
              ?.rc === "83"
              ? "Pricelist Digiflazz sedang terkena limit pengecekan. Tunggu beberapa saat sebelum mencoba lagi."
              : undefined,
        },
        {
          status:
            digiflazzError
              ?.rc === "83"
              ? 429
              : 502,
        }
      );
    }

    const allProducts =
      data.data as DigiflazzProduct[];

    /*
     * ===========================
     * FILTER FREE FIRE
     * ===========================
     */
    const freeFireProducts =
      allProducts
        .filter(
          (product) => {
            const brand =
              String(
                product.brand ??
                  ""
              )
                .trim()
                .toUpperCase();

            const name =
              String(
                product.product_name ??
                  ""
              )
                .trim()
                .toUpperCase();

            return (
              brand ===
                "FREE FIRE" ||
              name.includes(
                "FREE FIRE"
              )
            );
          }
        )

        /*
         * Hanya produk yang
         * Buyer + Seller aktif.
         */
        .filter(
          (product) =>
            product
              .buyer_product_status ===
              true &&
            product
              .seller_product_status ===
              true
        )

        /*
         * Urutkan berdasarkan
         * nominal diamond.
         */
        .sort(
          (a, b) =>
            getDiamondAmount(
              a.product_name
            ) -
            getDiamondAmount(
              b.product_name
            )
        );

    /*
     * ===========================
     * RESPONSE WEBSITE
     * ===========================
     */
    return NextResponse.json({
      success: true,

      mode,

      gateway:
        "gateway.falintino.com",

      message:
        "Produk Free Fire Digiflazz berhasil diambil melalui VPS gateway.",

      totalDigiflazzProducts:
        allProducts.length,

      totalFreeFireProducts:
        freeFireProducts.length,

      products:
        freeFireProducts.map(
          (product) => ({
            productName:
              product
                .product_name ??
              "",

            sku:
              product
                .buyer_sku_code ??
              "",

            price:
              Number(
                product.price ??
                  0
              ),

            category:
              product.category ??
              "",

            brand:
              product.brand ??
              "",

            type:
              product.type ??
              "",

            sellerName:
              product
                .seller_name ??
              "",

            description:
              product.desc ??
              "",

            buyerActive:
              product
                .buyer_product_status ===
              true,

            sellerActive:
              product
                .seller_product_status ===
              true,

            unlimitedStock:
              product
                .unlimited_stock ===
              true,

            stock:
              Number(
                product.stock ??
                  0
              ),

            multi:
              product.multi ===
              true,

            startCutOff:
              product
                .start_cut_off ??
              "",

            endCutOff:
              product
                .end_cut_off ??
              "",
          })
        ),
    });
  } catch (error) {
    console.error(
      "DIGIFLAZZ FREE FIRE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        stage:
          "DIGIFLAZZ_CONNECTION",

        gateway:
          "gateway.falintino.com",

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengambil produk Free Fire Digiflazz.",
      },
      {
        status: 500,
      }
    );
  }
}