import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  return digits;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      whatsapp?: string;
      password?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const whatsapp = normalizeWhatsapp(body.whatsapp ?? "");
    const password = body.password ?? "";

    if (name.length < 2) {
      return NextResponse.json(
        { message: "Nama minimal terdiri dari 2 karakter." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Masukkan alamat email yang valid." },
        { status: 400 },
      );
    }

    if (!/^62\d{8,13}$/.test(whatsapp)) {
      return NextResponse.json(
        { message: "Masukkan nomor WhatsApp yang valid." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal terdiri dari 8 karakter." },
        { status: 400 },
      );
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [{ email }, { whatsapp }],
      },
      select: {
        email: true,
        whatsapp: true,
      },
    });

    if (existingCustomer?.email === email) {
      return NextResponse.json(
        { message: "Email ini sudah terdaftar. Silakan login." },
        { status: 409 },
      );
    }

    if (existingCustomer?.whatsapp === whatsapp) {
      return NextResponse.json(
        { message: "Nomor WhatsApp ini sudah terdaftar. Silakan login." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        whatsapp,
        password: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await createSession(customer);

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil.",
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      { message: "Pendaftaran gagal. Silakan coba lagi." },
      { status: 500 },
    );
  }
}