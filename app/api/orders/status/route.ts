import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RequestBody = {
  invoices?: unknown;
};

const MAX_INVOICES = 10;

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as RequestBody;

    if (!Array.isArray(body.invoices)) {
      return NextResponse.json(
        {
          error:
            "Daftar invoice tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const invoices = [
      ...new Set(
        body.invoices
          .filter(
            (
              invoice
            ): invoice is string =>
              typeof invoice ===
              "string"
          )
          .map((invoice) =>
            invoice.trim()
          )
          .filter(Boolean)
      ),
    ].slice(0, MAX_INVOICES);

    if (invoices.length === 0) {
      return NextResponse.json({
        orders: [],
      });
    }

    const orders =
      await prisma.order.findMany({
        where: {
          invoice: {
            in: invoices,
          },
        },

        select: {
          invoice: true,
          paymentStatus: true,
          providerStatus: true,
        },
      });

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error(
      "Gagal mengambil status pesanan:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Gagal mengambil status pesanan.",
      },
      {
        status: 500,
      }
    );
  }
}