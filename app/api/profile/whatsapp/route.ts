import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { whatsapp?: string };
    const whatsapp = normalizeWhatsapp(String(body.whatsapp ?? ""));

    if (!/^62\d{8,13}$/.test(whatsapp)) {
      return NextResponse.json({ message: "Nomor WhatsApp tidak valid." }, { status: 400 });
    }

    const existing = await prisma.customer.findFirst({
      where: { whatsapp, NOT: { id: session.id } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Nomor WhatsApp tersebut sudah digunakan akun lain." },
        { status: 409 },
      );
    }

    const customer = await prisma.customer.update({
      where: { id: session.id },
      data: { whatsapp },
      select: { whatsapp: true },
    });

    return NextResponse.json({ success: true, whatsapp: customer.whatsapp });
  } catch (error) {
    console.error("UPDATE_PROFILE_WHATSAPP_ERROR", error);
    return NextResponse.json({ message: "Gagal memperbarui nomor WhatsApp. Silakan coba lagi." }, { status: 500 });
  }
}
