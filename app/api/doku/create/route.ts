import { NextResponse } from "next/server";
import {
  createHash,
  createHmac,
  randomUUID,
} from "node:crypto";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DokuResponse = {
  response?: {
    order?: {
      invoice_number?: string;
    };
    payment?: {
      token_id?: string;
      url?: string;
      expired_date?: string;
    };
  };
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
  message?: string;
};

function getAppUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://store.falintino.com"
  ).replace(/\/$/, "");
}

function normalizePhone(value: string) {
  const phone = value.replace(/\D/g, "");

  if (phone.startsWith("62")) {
    return phone;
  }

  if (phone.startsWith("0")) {
    return `62${phone.slice(1)}`;
  }

  return phone;
}

function generateDigest(body: string) {
  return createHash("sha256")
    .update(body)
    .digest("base64");
}

function generateSignature({
  clientId,
  requestId,
  requestTimestamp,
  requestTarget,
  digest,
  secretKey,
}: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  digest: string;
  secretKey: string;
}) {
  const signatureComponent = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`,
  ].join("\n");

  const signature = createHmac(
    "sha256",
    secretKey
  )
    .update(signatureComponent)
    .digest("base64");

  return `HMACSHA256=${signature}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const invoice = String(
      body.invoice ?? ""
    ).trim();

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    const clientId =
      process.env.DOKU_CLIENT_ID?.trim();

    const secretKey =
      process.env.DOKU_SECRET_KEY?.trim();

    if (!clientId || !secretKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Credential DOKU belum dikonfigurasi.",
        },
        {
          status: 500,
        }
      );
    }

    const order =
      await prisma.order.findUnique({
        where: {
          invoice,
        },
        include: {
          product: true,
          payment: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Pesanan tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pesanan ini sudah dibayar.",
        },
        {
          status: 400,
        }
      );
    }

    const amount = Number(order.total);

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Total pembayaran tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    const appUrl = getAppUrl();

    const requestTarget =
      "/checkout/v1/payment";

    const endpoint =
      "https://api.doku.com/checkout/v1/payment";

    const requestId = randomUUID();
    const requestTimestamp =
      new Date().toISOString();

    const requestPayload = {
      order: {
        amount,
        invoice_number: order.invoice,
        currency: "IDR",

        callback_url:
          `${appUrl}/payment/finish`,

        callback_url_result:
          `${appUrl}/payment/finish`,

        auto_redirect: true,

        line_items: [
          {
            id: String(
              order.product.sku
            ).substring(0, 64),

            name: String(
              order.product.name
            ).substring(0, 255),

            quantity: 1,
            price: amount,

            sku: String(
              order.product.sku
            ).substring(0, 64),

            category: "digital-product",
          },
        ],
      },

      payment: {
        payment_due_date: 60,
      },

      customer: {
        id: String(
          order.id
        ).substring(0, 50),

        name: "Pelanggan",

        phone: normalizePhone(
          order.whatsapp
        ),

        country: "ID",
      },

      additional_info: {
        override_notification_url:
          `${appUrl}/api/doku/notification`,
      },
    };

    const requestBody =
      JSON.stringify(requestPayload);

    const digest =
      generateDigest(requestBody);

    const signature =
      generateSignature({
        clientId,
        requestId,
        requestTimestamp,
        requestTarget,
        digest,
        secretKey,
      });

    const dokuResponse = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type":
            "application/json",

          "Client-Id": clientId,
          "Request-Id": requestId,
          "Request-Timestamp":
            requestTimestamp,

          Signature: signature,
        },

        body: requestBody,
        cache: "no-store",
      }
    );

    const data =
      (await dokuResponse.json()) as DokuResponse;

    if (!dokuResponse.ok) {
      console.error(
        "DOKU CREATE PAYMENT ERROR:",
        data
      );

      return NextResponse.json(
        {
          success: false,

          message:
            data.error?.message ||
            data.message ||
            "DOKU gagal membuat pembayaran.",
        },
        {
          status: dokuResponse.status,
        }
      );
    }

    const paymentUrl =
      data.response?.payment?.url;

    const tokenId =
      data.response?.payment?.token_id;

    if (!paymentUrl || !tokenId) {
      console.error(
        "DOKU INVALID RESPONSE:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "DOKU tidak mengembalikan link pembayaran.",
        },
        {
          status: 500,
        }
      );
    }

    await prisma.payment.upsert({
      where: {
        orderId: order.id,
      },

      update: {
        transactionId: tokenId,
        paymentType: "doku_checkout",
        status: "PENDING",
        grossAmount: amount,
      },

      create: {
        orderId: order.id,
        transactionId: tokenId,
        paymentType: "doku_checkout",
        status: "PENDING",
        grossAmount: amount,
      },
    });

    return NextResponse.json({
      success: true,
      token: tokenId,
      redirectUrl: paymentUrl,
      amount,
      invoice: order.invoice,
    });
  } catch (error) {
    console.error(
      "CREATE DOKU PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat membuat pembayaran.",
      },
      {
        status: 500,
      }
    );
  }
}