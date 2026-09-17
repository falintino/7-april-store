import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Pembuatan pembayaran DOKU dinonaktifkan. Gunakan checkout QRIS Midtrans.",
    },
    {
      status: 410,
    }
  );
}
