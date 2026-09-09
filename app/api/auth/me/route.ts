import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { customer: null },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const customer = await prisma.customer.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return NextResponse.json(
    { customer },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}