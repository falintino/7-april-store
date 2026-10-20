import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const uid = (request.nextUrl.searchParams.get("uid") ?? "").trim();

  if (!/^\d{6,20}$/.test(uid)) {
    return NextResponse.json(
      { ok: false, message: "UID harus berupa 6–20 digit angka." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const endpoint = new URL("https://free-ff-api-src-5plp.onrender.com/api/v1/account");
  endpoint.searchParams.set("region", "ID");
  endpoint.searchParams.set("uid", uid);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: "Layanan cek ID sedang tidak tersedia. Coba lagi nanti." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const data = await response.json();
    const nickname =
      typeof data?.basicInfo?.nickname === "string"
        ? data.basicInfo.nickname.trim()
        : "";
    const accountId = String(data?.basicInfo?.accountId ?? "");

    if (!nickname || (accountId && accountId !== uid)) {
      return NextResponse.json(
        { ok: false, message: "Nickname tidak ditemukan. Periksa UID atau coba lagi nanti." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { ok: true, uid, nickname, region: "ID" },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "API cek ID gratis sedang lambat atau tidak merespons. Coba lagi sebentar." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
