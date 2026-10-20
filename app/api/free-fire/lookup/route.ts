import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

async function readNickname(url: URL, uid: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const nicknameCandidates = [
    data?.basicInfo?.nickname,
    data?.basicinfo?.nickname,
    data?.player_nickname,
    data?.nickname,
    data?.name,
  ];

  const nickname = nicknameCandidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  )?.trim();

  const accountId = String(
    data?.basicInfo?.accountId ??
    data?.basicinfo?.accountid ??
    data?.account_id ??
    data?.uid ??
    data?.account_uid ??
    "",
  );

  if (!nickname || (accountId && accountId !== uid)) return null;
  return nickname;
}

export async function GET(request: NextRequest) {
  const uid = (request.nextUrl.searchParams.get("uid") ?? "").trim();

  if (!/^\d{6,20}$/.test(uid)) {
    return NextResponse.json(
      { ok: false, message: "UID harus berupa 6–20 digit angka." },
      { status: 400, headers: noStore },
    );
  }

  // Try the original free endpoint first, then a documented fallback.
  const primary = new URL("https://free-ff-api-src-5plp.onrender.com/api/v1/account");
  primary.searchParams.set("region", "ID");
  primary.searchParams.set("uid", uid);

  const fallback = new URL("https://freefirefwx-beta.squareweb.app/api/nick");
  fallback.searchParams.set("id", uid);

  for (const endpoint of [primary, fallback]) {
    try {
      const nickname = await readNickname(endpoint, uid);
      if (nickname) {
        return NextResponse.json(
          { ok: true, uid, nickname, region: "ID" },
          {
            headers: {
              ...noStore,
              "X-Content-Type-Options": "nosniff",
            },
          },
        );
      }
    } catch {
      // Continue to the next free provider if this one times out or fails.
    }
  }

  return NextResponse.json(
    {
      ok: false,
      message: "Layanan cek ID gratis sedang tidak merespons. Coba lagi nanti.",
    },
    { status: 503, headers: noStore },
  );
}
