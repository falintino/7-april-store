import crypto from "crypto";
import type { Prisma } from "@prisma/client";

import { processDigiflazzOrder, type DigiflazzProcessResult } from "@/lib/digiflazz";
import { prisma } from "@/lib/prisma";

type FallbackProduct = { providerCode: string; maxPrice: number };
type SafeFlow = {
  version: 1;
  attempt: 1;
  providerCode: string;
  maxPrice: number;
  refId: string;
  refundAttempts?: number;
  refundKey?: string;
  refundResponse?: unknown;
};

type DigiflazzData = {
  ref_id?: string;
  message?: string;
  status?: string;
  rc?: string;
  sn?: string;
  price?: number;
  buyer_last_saldo?: number;
};

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function readFlow(value: unknown): SafeFlow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const flow = (value as Record<string, unknown>)._safeFlow;
  if (!flow || typeof flow !== "object" || Array.isArray(flow)) return null;
  const data = flow as Record<string, unknown>;
  if (data.version !== 1 || data.attempt !== 1) return null;
  if (typeof data.providerCode !== "string" || typeof data.maxPrice !== "number" || typeof data.refId !== "string") return null;
  return data as unknown as SafeFlow;
}

function fallbackFor(productSku: string, primaryCode: string): FallbackProduct | null {
  const raw = process.env.DIGIFLAZZ_FALLBACK_PRODUCTS?.trim();
  if (!raw) return null;
  try {
    const config = JSON.parse(raw) as Record<string, Partial<FallbackProduct>>;
    const candidate = config[productSku] ?? config[primaryCode];
    if (!candidate || typeof candidate.providerCode !== "string" || !Number.isInteger(candidate.maxPrice) || Number(candidate.maxPrice) <= 0) return null;
    if (candidate.providerCode.trim() === primaryCode) return null;
    return { providerCode: candidate.providerCode.trim(), maxPrice: Number(candidate.maxPrice) };
  } catch {
    throw new Error("DIGIFLAZZ_FALLBACK_PRODUCTS bukan JSON yang valid.");
  }
}

function normalize(status?: string) {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "sukses") return "SUCCESS";
  if (value === "gagal") return "FAILED";
  return "PENDING";
}

function digiflazzConfig() {
  const username = process.env.DIGIFLAZZ_USERNAME?.trim();
  const mode = process.env.DIGIFLAZZ_MODE?.trim().toLowerCase() || "development";
  const apiKey = mode === "production"
    ? process.env.DIGIFLAZZ_PRODUCTION_KEY?.trim()
    : process.env.DIGIFLAZZ_DEVELOPMENT_KEY?.trim();
  if (!username || !apiKey) throw new Error("Konfigurasi Digiflazz belum lengkap.");
  return { username, apiKey, mode };
}

async function gatewayRequest(payload: Record<string, unknown>) {
  const response = await fetch("https://gateway.falintino.com/v1/transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "7-April-Store" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Gateway Digiflazz HTTP ${response.status}.`);
  try {
    return JSON.parse(body) as { data?: DigiflazzData };
  } catch {
    throw new Error("Respons Digiflazz tidak valid.");
  }
}

async function requestRefund(orderId: string): Promise<DigiflazzProcessResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) throw new Error("Order tidak ditemukan saat menyiapkan refund.");

  if (process.env.AUTO_REFUND_FAILED_ORDERS?.trim().toLowerCase() !== "true") {
    await prisma.order.updateMany({
      where: { id: orderId, providerStatus: "FAILED" },
      data: {
        providerStatus: "REFUND_REQUIRED",
        providerMessage: "Pengiriman gagal. Refund menunggu verifikasi dan aktivasi Refund API.",
        providerUpdatedAt: new Date(),
      },
    });
    return { skipped: false, providerStatus: "REFUND_REQUIRED", refId: order.providerRefId ?? undefined, message: "Refund perlu diproses." };
  }

  const claimed = await prisma.order.updateMany({
    where: { id: orderId, providerStatus: { in: ["FAILED", "REFUND_REQUIRED"] } },
    data: { providerStatus: "REFUND_PROCESSING", providerMessage: "Refund sedang diajukan.", providerUpdatedAt: new Date() },
  });
  if (claimed.count === 0) return { skipped: true, providerStatus: order.providerStatus, refId: order.providerRefId ?? undefined };

  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum tersedia.");
  const production = process.env.MIDTRANS_IS_PRODUCTION?.trim() === "true";
  const refundKey = `${order.invoice}-AUTO-REFUND-1`;

  try {
    const response = await fetch(`${production ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com"}/v2/${encodeURIComponent(order.invoice)}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refund_key: refundKey, reason: "Pengiriman produk digital gagal" }),
      cache: "no-store",
    });
    const responseBody = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok || String(responseBody.status_code ?? "") !== "200") {
      throw new Error(String(responseBody.status_message ?? `Refund Midtrans HTTP ${response.status}`));
    }
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "REFUND_PENDING",
          providerStatus: "REFUND_PENDING",
          providerMessage: "Refund disetujui dan menunggu konfirmasi bank atau penyedia pembayaran.",
          providerResponse: json({ _safeFlow: { ...(readFlow(order.providerResponse) ?? {}), refundKey, refundResponse: responseBody } }),
          providerUpdatedAt: new Date(),
        },
      }),
      prisma.payment.update({ where: { orderId }, data: { status: "REFUND_PENDING" } }),
    ]);
    return { skipped: false, providerStatus: "REFUND_PENDING", refId: order.providerRefId ?? undefined, message: "Refund sedang diproses." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refund Midtrans gagal diajukan.";
    await prisma.order.update({
      where: { id: orderId },
      data: { providerStatus: "REFUND_REQUIRED", providerMessage: message, providerUpdatedAt: new Date() },
    });
    return { skipped: false, providerStatus: "REFUND_REQUIRED", refId: order.providerRefId ?? undefined, message };
  }
}

async function processFallback(orderId: string, flow: SafeFlow): Promise<DigiflazzProcessResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) throw new Error("Order tidak ditemukan.");
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, providerStatus: { in: ["PENDING", "FAILED"] } },
    data: { providerStatus: "FALLBACK_PROCESSING", providerRefId: flow.refId, providerMessage: "Mencoba seller cadangan satu kali.", providerUpdatedAt: new Date() },
  });
  if (claimed.count === 0) return { skipped: true, providerStatus: order.providerStatus, refId: order.providerRefId ?? undefined };

  try {
    const { username, apiKey, mode } = digiflazzConfig();
    const payload: Record<string, unknown> = {
      username,
      buyer_sku_code: flow.providerCode,
      customer_no: order.uid,
      ref_id: flow.refId,
      sign: crypto.createHash("md5").update(`${username}${apiKey}${flow.refId}`).digest("hex"),
      max_price: flow.maxPrice,
    };
    if (mode !== "production") payload.testing = true;
    const response = await gatewayRequest(payload);
    if (!response.data) throw new Error("Digiflazz tidak memberikan data transaksi fallback.");
    const data = response.data;
    const providerStatus = normalize(data.status);
    await prisma.order.update({
      where: { id: orderId },
      data: {
        providerStatus,
        providerRefId: data.ref_id || flow.refId,
        providerSn: data.sn || null,
        providerRc: data.rc || null,
        providerMessage: data.message || null,
        providerActualPrice: typeof data.price === "number" ? data.price : null,
        providerLastBalance: typeof data.buyer_last_saldo === "number" ? data.buyer_last_saldo : null,
        providerResponse: json({ _safeFlow: flow, digiflazz: response }),
        providerUpdatedAt: new Date(),
      },
    });
    if (providerStatus === "FAILED") return requestRefund(orderId);
    return { skipped: false, providerStatus, refId: data.ref_id || flow.refId, rc: data.rc, message: data.message, sn: data.sn, price: data.price };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gangguan saat mengecek seller cadangan.";
    await prisma.order.update({
      where: { id: orderId },
      data: { providerStatus: "PENDING", providerRefId: flow.refId, providerMessage: message, providerResponse: json({ _safeFlow: flow }), providerUpdatedAt: new Date() },
    });
    throw error;
  }
}

export async function processOrderDelivery(orderId: string): Promise<DigiflazzProcessResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) throw new Error("Order tidak ditemukan.");
  if (order.paymentStatus !== "PAID") return { skipped: true, providerStatus: order.providerStatus, message: "Pembayaran belum PAID." };
  if (["SUCCESS", "REFUND_PROCESSING", "REFUND_PENDING", "REFUNDED"].includes(order.providerStatus)) {
    return { skipped: true, providerStatus: order.providerStatus, refId: order.providerRefId ?? undefined, sn: order.providerSn ?? undefined, message: order.providerMessage ?? undefined };
  }

  const flow = readFlow(order.providerResponse);
  if (flow && ["PENDING", "FAILED"].includes(order.providerStatus)) return processFallback(orderId, flow);
  if (order.providerStatus === "REFUND_REQUIRED") return requestRefund(orderId);
  if (["PROCESSING", "FALLBACK_PROCESSING"].includes(order.providerStatus)) return { skipped: true, providerStatus: order.providerStatus, refId: order.providerRefId ?? undefined, message: "Transaksi sedang diproses." };

  if (order.providerStatus === "FAILED") {
    const fallback = fallbackFor(order.product.sku, order.product.providerCode);
    if (!fallback) return requestRefund(orderId);
    const nextFlow: SafeFlow = { version: 1, attempt: 1, providerCode: fallback.providerCode, maxPrice: fallback.maxPrice, refId: `${order.invoice}-F1` };
    await prisma.order.updateMany({
      where: { id: orderId, providerStatus: "FAILED" },
      data: { providerStatus: "PENDING", providerRefId: nextFlow.refId, providerMessage: "Seller utama gagal. Menyiapkan seller cadangan.", providerResponse: json({ _safeFlow: nextFlow }), providerUpdatedAt: new Date() },
    });
    return processFallback(orderId, nextFlow);
  }

  const result = await processDigiflazzOrder(orderId);
  return result.providerStatus === "FAILED" ? processOrderDelivery(orderId) : result;
}
