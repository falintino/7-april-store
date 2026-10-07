import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { hashPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };

    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";

    if (!token || password.length < 8) {
      return NextResponse.json(
        { message: "Token atau password tidak valid." },
        { status: 400 },
      );
    }

    const tokenHash = hashPasswordResetToken(token);
    const now = new Date();

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        customerId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= now.getTime()
    ) {
      return NextResponse.json(
        { message: "Link reset tidak valid atau sudah kedaluwarsa." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (claimed.count !== 1) {
        throw new Error("RESET_TOKEN_ALREADY_USED");
      }

      await tx.customer.update({
        where: { id: resetToken.customerId },
        data: { password: passwordHash },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          customerId: resetToken.customerId,
          id: { not: resetToken.id },
        },
      });
    });

    return NextResponse.json({
      message: "Kata sandi berhasil diubah. Silakan login kembali.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RESET_TOKEN_ALREADY_USED") {
      return NextResponse.json(
        { message: "Link reset sudah digunakan atau kedaluwarsa." },
        { status: 400 },
      );
    }

    console.error("RESET_PASSWORD_ERROR", error);

    return NextResponse.json(
      { message: "Reset kata sandi gagal. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
