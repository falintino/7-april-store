import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi." },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Email atau password tidak sesuai." },
        { status: 401 },
      );
    }

    const passwordValid = await bcrypt.compare(password, customer.password);

    if (!passwordValid) {
      return NextResponse.json(
        { message: "Email atau password tidak sesuai." },
        { status: 401 },
      );
    }

    await createSession({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: customer.role,
    });

    return NextResponse.json({
      message: "Login berhasil.",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      { message: "Login gagal. Silakan coba lagi." },
      { status: 500 },
    );
  }
}