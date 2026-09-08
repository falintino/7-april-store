import crypto from "crypto";
import https from "https";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DigiflazzResponse = {
  data?: {
    ref_id?: string;
    customer_no?: string;
    buyer_sku_code?: string;
    message?: string;
    status?: string;
    rc?: string;
    sn?: string;
    price?: number;
    buyer_last_saldo?: number;
    tele?: string;
    wa?: string;
  };
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
    request.headers.get("authorization");

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

function getConfig() {
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

  if (!username) {
    throw new Error(
      "DIGIFLAZZ_USERNAME belum tersedia."
    );
  }

  if (!developmentKey) {
    throw new Error(
      "DIGIFLAZZ_DEVELOPMENT_KEY belum tersedia."
    );
  }

  return {
    username,
    developmentKey,
    mode,
  };
}

function sendDigiflazzRequest(
  payload: Record<string, unknown>
): Promise<DigiflazzResponse> {
  return new Promise(
    (resolve, reject) => {
      const body =
        JSON.stringify(payload);

      const req = https.request(
        {
          hostname:
            "gateway.falintino.com",

          port: 443,

          path:
            "/v1/transaction",

          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Content-Length":
              Buffer.byteLength(body),
          },
        },

        (res) => {
          let responseBody = "";

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

export async function POST(
  request: Request
) {
  try {
    /*
     * Route test tidak boleh dapat
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

    const {
      username,
      developmentKey,
      mode,
    } = getConfig();

    /*
     * Jangan izinkan route test
     * berjalan kalau website sudah
     * memakai mode production.
     */
    if (mode === "production") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Route test dinonaktifkan karena DIGIFLAZZ_MODE sedang production.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Ref ID unik untuk test ini.
     */
    const refId =
      `TEST-${Date.now()}`;

    const sign = md5(
      `${username}${developmentKey}${refId}`
    );

    /*
     * Test case development Digiflazz.
     *
     * Ini BUKAN produk Free Fire
     * pelanggan dan tidak menyentuh
     * database order website.
     */
    const payload = {
      username,

      buyer_sku_code:
        "xld10",

      customer_no:
        "087800001230",

      ref_id:
        refId,

      sign,

      testing: true,
    };

    const response =
      await sendDigiflazzRequest(
        payload
      );

    const data =
      response.data;

    return NextResponse.json({
      success: true,

      mode,

      gateway:
        "gateway.falintino.com",

      test: {
        refId,

        buyerSkuCode:
          "xld10",

        customerNo:
          "087800001230",
      },

      result: {
        status:
          data?.status ??
          null,

        rc:
          data?.rc ??
          null,

        message:
          data?.message ??
          null,

        sn:
          data?.sn ??
          null,

        price:
          data?.price ??
          null,

        buyerLastSaldo:
          data?.buyer_last_saldo ??
          null,

        refId:
          data?.ref_id ??
          null,

        buyerSkuCode:
          data?.buyer_sku_code ??
          null,

        customerNo:
          data?.customer_no ??
          null,
      },

      rawResponse:
        response,
    });
  } catch (error) {
    console.error(
      "DIGIFLAZZ TEST TRANSACTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menjalankan test Digiflazz.",
      },
      {
        status: 500,
      }
    );
  }
}