import crypto from "crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";

function safeEqual(
  a: string,
  b: string
) {
  const aBuffer =
    Buffer.from(a);

  const bBuffer =
    Buffer.from(b);

  if (
    aBuffer.length !==
    bBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    aBuffer,
    bBuffer
  );
}

function createSessionToken(
  password: string
) {
  const sessionSecret =
    process.env
      .ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error(
      "ADMIN_SESSION_SECRET belum dikonfigurasi."
    );
  }

  return crypto
    .createHmac(
      "sha256",
      sessionSecret
    )
    .update(password)
    .digest("hex");
}

export async function POST(
  request: Request
) {
  try {
    const adminPassword =
      process.env
        .ADMIN_PASSWORD;

    const sessionSecret =
      process.env
        .ADMIN_SESSION_SECRET;

    if (
      !adminPassword ||
      !sessionSecret
    ) {
      console.error(
        "ADMIN_PASSWORD atau ADMIN_SESSION_SECRET belum dikonfigurasi."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Konfigurasi login admin belum lengkap.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const password =
      String(
        body.password ?? ""
      );

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password admin wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !safeEqual(
        password,
        adminPassword
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password admin salah.",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      createSessionToken(
        adminPassword
      );

    const response =
      NextResponse.json({
        success: true,
        message:
          "Login admin berhasil.",
      });

    response.cookies.set(
      COOKIE_NAME,
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          60 * 60 * 12,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat login admin.",
      },
      {
        status: 500,
      }
    );
  }
}