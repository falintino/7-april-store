import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(request: Request) {
  const cronSecret =
    process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return false;
  }

  return (
    request.headers.get("authorization") ===
    `Bearer ${cronSecret}`
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  const products = await prisma.product.findMany();

  return NextResponse.json({
    success: true,
    data: products,
  });
}
