import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const GOOGLE_CALLBACK_URL =
  "https://store.falintino.com/api/auth/google/callback";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET belum diatur.");
  }

  return new TextEncoder().encode(secret);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;

  function loginRedirect(path: string) {
    const response = NextResponse.redirect(
      new URL(path, "https://store.falintino.com"),
    );

    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  if (error) {
    return loginRedirect(
      `/login?error=${encodeURIComponent(
        "Login Google dibatalkan.",
      )}`,
    );
  }

  if (!code || !state || !savedState || state !== savedState) {
    return loginRedirect(
      `/login?error=${encodeURIComponent(
        "Sesi login Google tidak valid. Silakan coba lagi.",
      )}`,
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("GOOGLE_OAUTH_CONFIG_MISSING");

    return loginRedirect(
      `/login?error=${encodeURIComponent(
        "Konfigurasi Google Login belum lengkap.",
      )}`,
    );
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }).toString(),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();

      console.error("GOOGLE_TOKEN_EXCHANGE_ERROR", tokenError);

      return loginRedirect(
        `/login?error=${encodeURIComponent(
          "Google gagal memverifikasi login. Silakan coba lagi.",
        )}`,
      );
    }

    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokens.access_token) {
      console.error("GOOGLE_ACCESS_TOKEN_MISSING");

      return loginRedirect(
        `/login?error=${encodeURIComponent(
          "Token Google tidak ditemukan.",
        )}`,
      );
    }

    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
      cache: "no-store",
    });

    if (!userInfoResponse.ok) {
      const userInfoError = await userInfoResponse.text();

      console.error("GOOGLE_USERINFO_ERROR", userInfoError);

      return loginRedirect(
        `/login?error=${encodeURIComponent(
          "Data akun Google tidak dapat dibaca.",
        )}`,
      );
    }

    const googleUser = (await userInfoResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    const googleId = googleUser.sub?.trim() ?? "";
    const email = googleUser.email?.trim().toLowerCase() ?? "";
    const name = googleUser.name?.trim() ?? "";

    if (!googleId || !email || !name) {
      return loginRedirect(
        `/login?error=${encodeURIComponent(
          "Data akun Google tidak lengkap.",
        )}`,
      );
    }

    if (googleUser.email_verified !== true) {
      return loginRedirect(
        `/login?error=${encodeURIComponent(
          "Email Google belum terverifikasi.",
        )}`,
      );
    }

    /*
     * =========================================
     * CUSTOMER SUDAH ADA
     * =========================================
     */

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        whatsapp: true,
      },
    });

    if (existingCustomer) {
      await createSession({
        id: existingCustomer.id,
        name: existingCustomer.name,
        email: existingCustomer.email,
        role: existingCustomer.role,
      });

      return loginRedirect("/profil");
    }

    /*
     * =========================================
     * CUSTOMER BARU
     * =========================================
     *
     * WhatsApp wajib diisi karena field
     * Customer.whatsapp di database wajib.
     *
     * Kita simpan data Google sementara
     * selama 10 menit dalam JWT yang
     * ditandatangani AUTH_SECRET.
     */

    const pendingToken = await new SignJWT({
      email,
      name,
      googleId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(getAuthSecret());

    const response = NextResponse.redirect(
      new URL(
        "/lengkapi-akun-google",
        "https://store.falintino.com",
      ),
    );

    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("google_pending", pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("GOOGLE_CALLBACK_ERROR", error);

    return loginRedirect(
      `/login?error=${encodeURIComponent(
        "Login Google gagal. Silakan coba lagi.",
      )}`,
    );
  }
}