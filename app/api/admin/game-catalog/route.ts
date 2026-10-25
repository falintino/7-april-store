import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PriceListItem = {
  product_name?: string;
  category?: string;
  brand?: string;
  type?: string;
  price?: number | string;
  buyer_sku_code?: string;
  buyer_product_status?: boolean;
  seller_product_status?: boolean;
  desc?: string;
};

function getConfig() {
  const username = process.env.DIGIFLAZZ_USERNAME?.trim();
  const mode = (process.env.DIGIFLAZZ_MODE ?? "development").trim().toLowerCase();
  const key = (mode === "production"
    ? process.env.DIGIFLAZZ_PRODUCTION_KEY
    : process.env.DIGIFLAZZ_DEVELOPMENT_KEY)?.trim();
  if (!username || !key || !["production", "development"].includes(mode)) {
    throw new Error("Konfigurasi Digiflazz belum lengkap atau mode tidak valid.");
  }
  return {
    username,
    sign: createHash("md5").update(username + key + "pricelist").digest("hex"),
  };
}

async function fetchGameCatalog(): Promise<PriceListItem[]> {
  const config = getConfig();
  const response = await fetch("https://gateway.falintino.com/v1/price-list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cmd: "prepaid", username: config.username, sign: config.sign }),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(`Gateway Digiflazz merespons HTTP ${response.status}.`);
  }
  const payload = await response.json() as { data?: unknown };
  if (!Array.isArray(payload.data)) {
    throw new Error("Respons daftar harga Digiflazz tidak sesuai format.");
  }
  return payload.data as PriceListItem[];
}

function classify(item: PriceListItem): "Mobile Legends" | "Roblox" | null {
  const brand = String(item.brand ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = String(item.product_name ?? "").toLowerCase();
  const desc = String(item.desc ?? "").toLowerCase();
  const category = String(item.category ?? "").toLowerCase();
  const searchable = [name, desc, category].join(" ");
  if (brand.includes("mobilelegend") || brand === "mlbb" || searchable.includes("mobile legends") || searchable.includes("mobilelegend")) {
    return "Mobile Legends";
  }
  if (brand.includes("roblox") || searchable.includes("roblox")) {
    return "Roblox";
  }
  return null;
}

function safeSalePrice(price: number) {
  return price + Math.max(500, Math.ceil(price * 0.05));
}

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }
    const [catalog, storedProducts] = await Promise.all([
      fetchGameCatalog(),
      prisma.product.findMany({
        where: { game: { in: ["Mobile Legends", "Roblox"] } },
        orderBy: [{ game: "asc" }, { price: "asc" }],
        select: { id: true, game: true, name: true, sku: true, providerCode: true, price: true, providerPrice: true, active: true },
      }),
    ]);
    const candidates = catalog
      .map((item) => {
        const game = classify(item);
        const price = Number(item.price);
        const sku = String(item.buyer_sku_code ?? "").trim();
        if (!game || !sku || !Number.isSafeInteger(price) || price <= 0) return null;
        return {
          game,
          name: String(item.product_name ?? item.desc ?? sku).trim().slice(0, 120),
          sku,
          providerCode: sku,
          providerPrice: price,
          suggestedPrice: safeSalePrice(price),
          category: String(item.category ?? ""),
          brand: String(item.brand ?? ""),
          type: String(item.type ?? ""),
          description: String(item.desc ?? ""),
          buyerActive: item.buyer_product_status === true,
          sellerActive: item.seller_product_status === true,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => item.buyerActive && item.sellerActive);
    return NextResponse.json({
      success: true,
      candidates,
      products: storedProducts,
      message: "Kandidat berasal dari daftar harga Buyer Digiflazz yang aktif. Produk baru tidak diaktifkan otomatis.",
    });
  } catch (error) {
    console.error("GAME CATALOG READ ERROR:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Gagal membaca daftar harga Digiflazz.",
    }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }
    const body = await request.json() as { sku?: unknown; game?: unknown };
    const sku = String(body.sku ?? "").trim();
    const requestedGame = String(body.game ?? "").trim();
    if (!sku || !["Mobile Legends", "Roblox"].includes(requestedGame)) {
      return NextResponse.json({ success: false, message: "Produk atau game tidak valid." }, { status: 400 });
    }

    const catalog = await fetchGameCatalog();
    const match = catalog.find((item) => String(item.buyer_sku_code ?? "").trim() === sku);
    const game = match ? classify(match) : null;
    const providerPrice = Number(match?.price);
    if (!match || game !== requestedGame || match.buyer_product_status !== true || match.seller_product_status !== true || !Number.isSafeInteger(providerPrice) || providerPrice <= 0) {
      return NextResponse.json({ success: false, message: "SKU tidak ditemukan sebagai produk aktif yang cocok di daftar harga Digiflazz." }, { status: 409 });
    }

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing && existing.game !== game) {
      return NextResponse.json({ success: false, message: "SKU ini sudah digunakan produk lain. Tidak ada data yang diubah." }, { status: 409 });
    }

    const suggestedPrice = safeSalePrice(providerPrice);
    const product = existing
      ? await prisma.product.update({
          where: { sku },
          data: { game, name: String(match.product_name ?? match.desc ?? sku).trim().slice(0, 120), providerCode: sku, providerPrice },
          select: { id: true, game: true, name: true, sku: true, price: true, providerPrice: true, active: true },
        })
      : await prisma.product.create({
          data: {
            game,
            name: String(match.product_name ?? match.desc ?? sku).trim().slice(0, 120),
            sku,
            providerCode: sku,
            providerPrice,
            price: suggestedPrice,
            popular: false,
            active: false,
          },
          select: { id: true, game: true, name: true, sku: true, price: true, providerPrice: true, active: true },
        });

    return NextResponse.json({
      success: true,
      product,
      created: !existing,
      message: existing
        ? "Harga modal dan nama produk diperbarui. Status aktif dan harga jual yang sudah kamu atur tetap dipertahankan."
        : "Produk diimpor dalam keadaan NONAKTIF. Periksa jenis produk, harga jual, dan format tujuan sebelum mengaktifkannya.",
    });
  } catch (error) {
    console.error("GAME CATALOG IMPORT ERROR:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Gagal mengimpor produk." }, { status: 502 });
  }
}
