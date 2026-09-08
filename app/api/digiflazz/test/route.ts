import { NextResponse } from "next/server";
import { createHash } from "crypto";
import https from "https";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DigiflazzResponse = {
  data?: unknown;
  message?: string;
};

function postDigiflazz(
  body: Record<string, unknown>
): Promise<{
  statusCode: number;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);

    const request = https.request(
      {
        /*
         * Semua request test Digiflazz
         * sekarang melewati VPS gateway:
         *
         * Vercel
         *   ↓
         * gateway.falintino.com
         *   ↓
         * Digiflazz
         */
        hostname: "gateway.falintino.com",
        port: 443,
        path: "/v1/price-list",
        method: "POST",

        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "User-Agent": "7-April-Store/1.0",
        },

        timeout: 15000,
      },

      (response) => {
        let rawData = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          rawData += chunk;
        });

        response.on("end", () => {
          resolve({
            statusCode:
              response.statusCode ?? 500,

            body: rawData,
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(
        new Error(
          "Koneksi ke gateway Digiflazz timeout."
        )
      );
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.write(payload);
    request.end();
  });
}

export async function GET() {
  try {
    const username =
      process.env.DIGIFLAZZ_USERNAME?.trim();

    const mode =
      process.env.DIGIFLAZZ_MODE?.trim() ||
      "development";

    const developmentKey =
      process.env.DIGIFLAZZ_DEVELOPMENT_KEY?.trim();

    const productionKey =
      process.env.DIGIFLAZZ_PRODUCTION_KEY?.trim();

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          stage: "ENV",
          message:
            "DIGIFLAZZ_USERNAME belum terbaca dari .env",
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
              ? "DIGIFLAZZ_PRODUCTION_KEY belum terbaca dari .env"
              : "DIGIFLAZZ_DEVELOPMENT_KEY belum terbaca dari .env",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Signature daftar harga Digiflazz:
     *
     * md5(
     *   username +
     *   apiKey +
     *   "pricelist"
     * )
     */
    const sign = createHash("md5")
      .update(
        `${username}${apiKey}pricelist`
      )
      .digest("hex");

    const result =
      await postDigiflazz({
        cmd: "prepaid",
        username,
        sign,
      });

    let data: DigiflazzResponse;

    try {
      data = JSON.parse(
        result.body
      ) as DigiflazzResponse;
    } catch {
      return NextResponse.json(
        {
          success: false,
          stage: "PARSE_RESPONSE",
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

    if (
      result.statusCode < 200 ||
      result.statusCode >= 300
    ) {
      return NextResponse.json(
        {
          success: false,
          stage:
            "DIGIFLAZZ_RESPONSE",

          httpStatus:
            result.statusCode,

          mode,

          data,
        },
        {
          status:
            result.statusCode,
        }
      );
    }

    const productData =
      Array.isArray(data.data)
        ? data.data
        : [];

    return NextResponse.json({
      success: true,

      mode,

      gateway:
        "gateway.falintino.com",

      message:
        "Koneksi Digiflazz melalui VPS gateway berhasil.",

      totalProducts:
        productData.length,

      data,
    });
  } catch (error) {
    console.error(
      "DIGIFLAZZ TEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        stage:
          "DIGIFLAZZ_CONNECTION",

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menghubungi Digiflazz melalui gateway.",
      },
      {
        status: 500,
      }
    );
  }
}