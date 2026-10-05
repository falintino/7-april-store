import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MidtransStatusResponse = {
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  order_id?: string;
  payment_type?: string;
  transaction_status?: string;
  fraud_status?: string;
  gross_amount?: string;
  signature_key?: string;
};

function isSuccessfulPayment(data: MidtransStatusResponse) {
  const status = String(data.transaction_status ?? "").trim().toLowerCase();
  const fraud = String(data.fraud_status ?? "").trim().toLowerCase();

  if (status === "settlement") return true;

  return status === "capture" && (!fraud || fraud === "accept");
}

export async function POST(request: Request) {
  try {
    // Endpoint ini hanya boleh dipakai dari sesi admin.
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      invoice?: unknown;
    };

    const invoice = String(body.invoice ?? "").trim();

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice wajib diisi.",
        },
        { status: 400 },
      );
    }

    // Jangan izinkan invoice arbitrer yang bukan format invoice toko.
    if (!/^7A-\d{8}-\d{6}$/.test(invoice)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format invoice tidak valid.",
        },
        { status: 400 },
      );
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

    if (!serverKey) {
      return NextResponse.json(
        {
          success: false,
          message: "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
        },
        { status: 500 },
      );
    }

    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION?.trim() === "true";

    const baseUrl = isProduction
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";

    /*
     * Midtrans Get Status API dipakai sebagai failover/reconciliation
     * ketika HTTP notification belum masuk ke merchant.
     */
    const response = await fetch(
      `${baseUrl}/v2/${encodeURIComponent(invoice)}/status`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );

    const data =
      (await response.json().catch(() => ({}))) as MidtransStatusResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            data.status_message ??
            `Midtrans Get Status gagal (HTTP ${response.status}).`,
          midtrans: {
            statusCode: data.status_code ?? null,
            transactionStatus: data.transaction_status ?? null,
          },
        },
        { status: response.status },
      );
    }

    if (String(data.order_id ?? "").trim() !== invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID dari Midtrans tidak cocok dengan invoice.",
        },
        { status: 409 },
      );
    }

    if (!isSuccessfulPayment(data)) {
      return NextResponse.json({
        success: true,
        reconciled: false,
        message: `Status Midtrans saat ini: ${String(
          data.transaction_status ?? "unknown",
        )}.`,
        midtrans: {
          orderId: data.order_id ?? null,
          transactionId: data.transaction_id ?? null,
          transactionStatus: data.transaction_status ?? null,
          fraudStatus: data.fraud_status ?? null,
          grossAmount: data.gross_amount ?? null,
          paymentType: data.payment_type ?? null,
        },
      });
    }

    /*
     * Get Status API mengembalikan signature_key.
     * Kita teruskan response tersebut ke webhook yang sama supaya:
     *
     * - validasi signature tetap satu sumber,
     * - validasi nominal tetap satu sumber,
     * - update Order + Payment tetap satu sumber,
     * - redeem promo tetap satu sumber,
     * - processOrderDelivery() tetap satu sumber.
     *
     * Ini juga membuat reconciliation aman terhadap webhook duplikat.
     */
    if (
      !data.signature_key ||
      !data.status_code ||
      !data.gross_amount ||
      !data.transaction_id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Response Get Status tidak memiliki data yang diperlukan untuk reconciliation.",
        },
        { status: 502 },
      );
    }

    const notificationUrl = new URL(
      "/api/midtrans/notification",
      request.url,
    );

    const notificationResponse = await fetch(notificationUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    const notificationBody = await notificationResponse
      .json()
      .catch(() => ({
        success: false,
        message: "Response webhook tidak valid.",
      }));

    if (!notificationResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          reconciled: false,
          message:
            "Status Midtrans berhasil ditemukan, tetapi webhook reconciliation gagal memproses order.",
          webhookStatus: notificationResponse.status,
          webhook: notificationBody,
          midtrans: {
            orderId: data.order_id ?? null,
            transactionId: data.transaction_id ?? null,
            transactionStatus: data.transaction_status ?? null,
            fraudStatus: data.fraud_status ?? null,
            grossAmount: data.gross_amount ?? null,
            paymentType: data.payment_type ?? null,
          },
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      reconciled: true,
      message: "Status Midtrans berhasil direkonsiliasi.",
      midtrans: {
        orderId: data.order_id ?? null,
        transactionId: data.transaction_id ?? null,
        transactionStatus: data.transaction_status ?? null,
        fraudStatus: data.fraud_status ?? null,
        grossAmount: data.gross_amount ?? null,
        paymentType: data.payment_type ?? null,
      },
      webhook: notificationBody,
    });
  } catch (error) {
    console.error("MIDTRANS RECONCILE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal melakukan reconciliation Midtrans.",
      },
      { status: 500 },
    );
  }
}
