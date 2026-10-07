import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { randomBytes } from "crypto";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type GooglePendingPayload = {
  email?: string;
  name?: string;
  googleId?: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET belum diatur.");
  }

  return new TextEncoder().encode(secret);
}

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  return digits;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const pendingToken = cookieStore.get("google_pending")?.value;

    if (!pendingToken) {
      return NextResponse.json(
        {
          message:
            "Sesi pendaftaran Google sudah tidak berlaku. Silakan login dengan Google lagi.",
        },
        { status: 401 },
      );
    }

    let payload: GooglePendingPayload;

    try {
      const verified = await jwtVerify(pendingToken, getAuthSecret());

      payload = {
        email:
          typeof verified.payload.email === "string"
            ? verified.payload.email
            : undefined,
        name:
          typeof verified.payload.name === "string"
            ? verified.payload.name
            : undefined,
        googleId:
          typeof verified.payload.googleId === "string"
            ? verified.payload.googleId
            : undefined,
      };
    } catch {
      return NextResponse.json(
        {
          message:
            "Sesi pendaftaran Google tidak valid atau sudah kedaluwarsa.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      whatsapp?: string;
    };

    const whatsapp = normalizeWhatsapp(body.whatsapp ?? "");
    const email = payload.email?.trim().toLowerCase() ?? "";
    const name = payload.name?.trim() ?? "";

    if (!email || !name) {
      return NextResponse.json(
        {
          message:
            "Data akun Google tidak lengkap. Silakan ulangi login Google.",
        },
        { status: 400 },
      );
    }

    if (!/^62\d{8,13}$/.test(whatsapp)) {
      return NextResponse.json(
        {
          message: "Masukkan nomor WhatsApp yang valid.",
        },
        { status: 400 },
      );
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [{ email }, { whatsapp }],
      },
      select: {
        id: true,
        email: true,
        whatsapp: true,
      },
    });

    if (existingCustomer?.email === email) {
      return NextResponse.json(
        {
          message:
            "Email Google ini sudah memiliki akun. Silakan login dengan Google dari halaman login.",
        },
        { status: 409 },
      );
    }

    if (existingCustomer?.whatsapp === whatsapp) {
      return NextResponse.json(
        {
          message:
            "Nomor WhatsApp ini sudah terdaftar pada akun lain. Gunakan nomor lain.",
        },
        { status: 409 },
      );
    }

    /*
     * Akun Google tidak membutuhkan password untuk
     * proses login Google, tetapi field password di
     * database Customer tetap wajib.
     *
     * Kita membuat password acak yang tidak diketahui
     * pengguna. Login akun ini nantinya melalui Google.
     */
    const randomPassword = randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 12);

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

    const response = NextResponse.json({
      message: "Akun Google berhasil dibuat.",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    });

    response.cookies.set("google_pending", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("GOOGLE_COMPLETE_ERROR", error);

    return NextResponse.json(
      {
        message:
          "Akun Google gagal dibuat. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }
}