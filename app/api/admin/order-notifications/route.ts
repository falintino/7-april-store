import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak." },
      { status: 401 },
    );
  }

  const orders = await prisma.order.findMany({
    take: 100,
    orderBy: { updatedAt: "desc" },
    select: {
      invoice: true,
      paymentStatus: true,
      providerStatus: true,
      updatedAt: true,
      product: { select: { name: true } },
    },
  });

  return NextResponse.json(
    {
      success: true,
      orders: orders.map((order) => ({
        invoice: order.invoice,
        paymentStatus: order.paymentStatus,
        providerStatus: order.providerStatus,
        updatedAt: order.updatedAt.toISOString(),
        productName: order.product.name,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
