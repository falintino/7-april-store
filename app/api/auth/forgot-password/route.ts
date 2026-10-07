import { NextResponse } from "next/server";

import {
  createPasswordResetToken,
  getPasswordResetUrl,
  sendPasswordResetEmail,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

const GENERIC_MESSAGE =
  "Kalau email tersebut terdaftar, kami akan mengirimkan link reset kata sandi ke email kamu.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Masukkan alamat email yang valid." },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!customer) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const reset = createPasswordResetToken();

    await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ customerId: customer.id }, { expiresAt: { lt: new Date() } }],
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        customerId: customer.id,
        tokenHash: reset.tokenHash,
        expiresAt: reset.expiresAt,
      },
    });

    try {
      await sendPasswordResetEmail({
        email: customer.email,
        name: customer.name,
        resetUrl: getPasswordResetUrl(reset.token),
      });
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash: reset.tokenHash },
      });
      console.error("PASSWORD_RESET_EMAIL_ERROR", error);

      return NextResponse.json(
        { message: "Email reset belum bisa dikirim. Silakan coba lagi nanti." },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR", error);

    return NextResponse.json(
      { message: "Permintaan reset gagal. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
