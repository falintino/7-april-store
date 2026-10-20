import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

async function readNickname(url: URL, uid: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(6500),
  });
  if (!response.ok) return null;

  const data = await response.json();
  const basic = data?.basicInfo ?? data?.result?.basicInfo ?? data?.accountBasicInfo?.[0];
  const nicknameCandidates = [
    basic?.nickname,
    data?.player_nickname,
    data?.nickname,
    data?.name,
  ];
  const nickname = nicknameCandidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  )?.trim();

  const accountId = String(
    basic?.accountId ?? basic?.account_id ?? data?.account_id ?? data?.uid ?? data?.account_uid ?? "",
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

  const onrender = new URL("https://free-ff-api-src-5plp.onrender.com/api/v1/account");
  onrender.searchParams.set("region", "ID");
  onrender.searchParams.set("uid", uid);

  // The documented /api/nick endpoint searches configured regions when region is omitted.
  // Do not force "ind", which may exclude Indonesian accounts.
  const squareweb = new URL("https://freefirefwx-beta.squareweb.app/api/nick");
  squareweb.searchParams.set("id", uid);

  const freefireapis = new URL("https://freefireapis.lat/info-player");
  freefireapis.searchParams.set("uid", uid);
  freefireapis.searchParams.set("region", "ID");

  const results = await Promise.allSettled(
    [onrender, squareweb, freefireapis].map((url) => readNickname(url, uid)),
  );
  const nickname = results
    .filter((result): result is PromiseFulfilledResult<string | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .find((value): value is string => Boolean(value));

  if (!nickname) {
    return NextResponse.json(
      { ok: false, message: "Layanan cek ID gratis sedang tidak merespons. Coba lagi nanti." },
      { status: 503, headers: noStore },
    );
  }

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
