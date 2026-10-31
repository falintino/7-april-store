import crypto from "crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/prisma-cloudflare";
import { processOrderDelivery } from "@/lib/order-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DigiflazzWebhook = {
  sed?: string;
  hook_id?: string;
  hook?: { url?: string; secret?: string; type?: string; status?: number };
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
  };
};

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeStatus(status?: string, rc?: string) {
  if (String(rc ?? "").trim() === "70") return "PENDING";

  const value = String(status ?? "").trim().toLowerCase();
  if (value === "sukses") return "SUCCESS";
  if (value === "gagal") return "FAILED";
  return "PENDING";
}

function validSignature(rawBody: string, received: string | null, secret: string) {
  if (!received) return false;

  const expected = "sha1=" + crypto
    .createHmac("sha1", secret)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(received.trim());

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  const secret = process.env.DIGIFLAZZ_WEBHOOK_SECRET?.trim();

  if (!secret) {
    console.error("DIGIFLAZZ_WEBHOOK_SECRET belum dikonfigurasi.");
    return NextResponse.json({ success: false, message: "Webhook belum dikonfigurasi." }, { status: 503 });
  }

  const rawBody = await request.text();
  let payload: DigiflazzWebhook;
  try {
    payload = JSON.parse(rawBody) as DigiflazzWebhook;
  } catch {
    return NextResponse.json({ success: false, message: "Payload JSON tidak valid." }, { status: 400 });
  }

  const receivedSignature = request.headers.get("x-hub-signature");
  const isPing = typeof payload.hook_id === "string" && typeof payload.sed === "string";

  // Digiflazz's documented ping request can arrive without X-Hub-Signature.
  // A ping has no transaction data and this branch performs no order changes.
  // If a signature is provided, still validate it before acknowledging the ping.
  if (isPing && !receivedSignature) {
    return NextResponse.json({ success: true, event: "ping", hookId: payload.hook_id });
  }

  if (!validSignature(rawBody, receivedSignature, secret)) {
    // Safe diagnostics only: never log the secret, raw body, or full signature.
    const normalizedSignature = receivedSignature?.trim() ?? "";
    console.warn("Digiflazz webhook signature rejected", {
      isPing,
      hasSignatureHeader: receivedSignature !== null,
      hasSha1Prefix: normalizedSignature.startsWith("sha1="),
      receivedSignatureLength: normalizedSignature.length,
      receivedDigestLength: normalizedSignature.startsWith("sha1=")
        ? normalizedSignature.length - 5
        : normalizedSignature.length,
      expectedSignatureLength: 45,
      secretLength: secret.length,
      rawBodyLength: Buffer.byteLength(rawBody, "utf8"),
    });
    return NextResponse.json({ success: false, message: "Signature tidak valid." }, { status: 401 });
  }

  if (isPing) {
    return NextResponse.json({ success: true, event: "ping", hookId: payload.hook_id });
  }

  const data = payload.data;
  const refId = String(data?.ref_id ?? "").trim();
  const customerNo = String(data?.customer_no ?? "").trim();
  const sku = String(data?.buyer_sku_code ?? "").trim();

  if (!data || !refId || !customerNo || !sku || !data.status) {
    return NextResponse.json({ success: false, message: "Data transaksi tidak lengkap." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ providerRefId: refId }, { invoice: refId }],
    },
    include: { product: true },
  });

  if (!order) {
    // Acknowledge unknown/old events to avoid retry storms; log only the reference.
    console.warn("Digiflazz webhook: order tidak ditemukan untuk ref_id", refId);
    return NextResponse.json({ success: true, ignored: true });
  }

  if (order.paymentStatus !== "PAID" || order.uid.trim() !== customerNo) {
    console.warn("Digiflazz webhook: order tidak cocok", refId);
    return NextResponse.json({ success: false, message: "Data transaksi tidak cocok." }, { status: 409 });
  }

  let expectedSku = order.product.providerCode;
  const response = order.providerResponse;
  if (response && typeof response === "object" && !Array.isArray(response)) {
    const safeFlow = (response as Record<string, unknown>)._safeFlow;
    if (safeFlow && typeof safeFlow === "object" && !Array.isArray(safeFlow)) {
      const fallbackCode = (safeFlow as Record<string, unknown>).providerCode;
      if (typeof fallbackCode === "string" && order.providerRefId === refId) {
        expectedSku = fallbackCode;
      }
    }
  }

  if (expectedSku !== sku) {
    console.warn("Digiflazz webhook: SKU tidak cocok", refId);
    return NextResponse.json({ success: false, message: "SKU transaksi tidak cocok." }, { status: 409 });
  }

  const providerStatus = normalizeStatus(data.status, data.rc);

  // Webhooks may be retried or arrive while the synchronous API request is returning.
  // Only update an order still in an in-flight state; never overwrite final/refund states.
  const updated = await prisma.order.updateMany({
    where: {
      id: order.id,
      paymentStatus: "PAID",
      providerStatus: { in: ["PENDING", "PROCESSING", "FALLBACK_PROCESSING"] },
      OR: [{ providerRefId: refId }, { invoice: refId }],
    },
    data: {
      providerStatus,
      providerRefId: refId,
      providerSn: data.sn || null,
      providerRc: data.rc || null,
      providerMessage: data.message || null,
      providerActualPrice: typeof data.price === "number" ? data.price : null,
      providerLastBalance: typeof data.buyer_last_saldo === "number" ? data.buyer_last_saldo : null,
      providerResponse: json(payload),
      providerUpdatedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ success: true, ignored: true, message: "Status sudah final atau sedang berubah." });
  }

  // If provider says failed, reuse the existing fallback/refund flow.
  if (providerStatus === "FAILED") {
    try {
      await processOrderDelivery(order.id);
    } catch (error) {
      console.error("DIGIFLAZZ WEBHOOK FAILED-FLOW ERROR:", {
        invoice: order.invoice,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ success: true, invoice: order.invoice, providerStatus });
}
