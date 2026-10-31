import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma-cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0" };

// Only completed deliveries count as successful transactions.
// No customer identifiers or phone numbers are exposed publicly.
const successfulOrderWhere = {
  paymentStatus: { in: ["PAID", "SUCCESS"] },
  providerStatus: { in: ["SUCCESS", "SUKSES"] },
};

export async function GET() {
  const prisma = getPrisma();
  try {
    const [totalTransactions, recentOrders] = await Promise.all([
      prisma.order.count({ where: successfulOrderWhere }),
      prisma.order.findMany({
        where: successfulOrderWhere,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          createdAt: true,
          uid: true,
          product: { select: { name: true, game: true } },
        },
      }),
    ]);

    return NextResponse.json(
      {
        totalTransactions,
        recentPurchases: recentOrders
          .filter((order) => order.product.game.toLowerCase().includes("free fire"))
          .map((order) => ({
            productName: order.product.name,
            // Public activity uses a masked UID to avoid exposing a full player identifier.
            userId: order.uid.length > 5 ? `${order.uid.slice(0, 2)}***${order.uid.slice(-3)}` : "***",
            createdAt: order.createdAt.toISOString(),
          })),
        updatedAt: new Date().toISOString(),
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error("Gagal mengambil statistik transaksi:", error);
    return NextResponse.json(
      { message: "Statistik transaksi belum tersedia." },
      { status: 503, headers: noStore },
    );
  }
}
