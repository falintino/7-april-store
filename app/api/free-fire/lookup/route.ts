import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

function findNickname(data: any): string | null {
  const candidates: unknown[] = [
    data?.nickname,
    data?.player_nickname,
    data?.name,
    data?.username,
    data?.userName,
    data?.data?.nickname,
    data?.data?.player_nickname,
    data?.data?.name,
    data?.data?.username,
    data?.result?.nickname,
    data?.result?.player_nickname,
    data?.result?.name,
    data?.result?.username,
    data?.data?.data?.nickname,
    data?.data?.data?.name,
    data?.basicInfo?.nickname,
    data?.result?.basicInfo?.nickname,
    data?.data?.basicInfo?.nickname,
    data?.accountBasicInfo?.[0]?.nickname,
  ];
  return candidates.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  )?.trim() ?? null;
}


async function readCutiezyNickname(uid: string, apiKey: string): Promise<{ nickname: string; region: string } | null> {
  const url = new URL("https://api.cutiezy.id/api/check/games/free-fire");
  url.searchParams.set("user_id", uid);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return null;

  const data: any = await response.json();
  const returnedId = String(data?.data?.id ?? "");
  const nickname = typeof data?.data?.nickname === "string"
    ? data.data.nickname.trim()
    : "";

  // Only accept a successful response that belongs to the requested UID.
  if (data?.success !== true || data?.ok !== true || !nickname || (returnedId && returnedId !== uid)) {
    return null;
  }

  return {
    nickname,
    region: String(data?.data?.country_code ?? "ID").trim() || "ID",
  };
}

async function readOmegaNickname(uid: string, apiKey: string): Promise<string | null> {
  const url = new URL("https://api.omegatronik.co.id/api/game/freefire-dg");
  url.searchParams.set("id", uid);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;

  const data: unknown = await response.json();
  return findNickname(data);
}

async function readLegacyNickname(url: URL, uid: string): Promise<string | null> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(6500),
  });
  if (!response.ok) return null;

  const data: any = await response.json();
  const basic = data?.basicInfo ?? data?.result?.basicInfo ?? data?.accountBasicInfo?.[0];
  const nickname = findNickname(data) ?? (
    typeof basic?.nickname === "string" ? basic.nickname.trim() : null
  );
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


  // Cutiezy is the primary provider. Keep its API key on the server only.
  const cutiezyKey = process.env.CUTIEZY_API_KEY?.trim();
  if (cutiezyKey) {
    try {
      const result = await readCutiezyNickname(uid, cutiezyKey);
      if (result) {
        return NextResponse.json(
          { ok: true, uid, nickname: result.nickname, region: result.region },
          { headers: { ...noStore, "X-Content-Type-Options": "nosniff" } },
        );
      }
    } catch {
      // If Cutiezy is unavailable, continue to the existing providers.
    }
  }

  // Configure this in server environment variables. Never expose the key in frontend code.
  const omegaKey = process.env.OMEGATRONIK_API_KEY?.trim();
  if (omegaKey) {
    try {
      const nickname = await readOmegaNickname(uid, omegaKey);
      if (nickname) {
        return NextResponse.json(
          { ok: true, uid, nickname, region: "ID" },
          { headers: { ...noStore, "X-Content-Type-Options": "nosniff" } },
        );
      }
    } catch {
      // If Omega is unavailable or its response shape differs, try the existing providers.
    }
  }

  const onrender = new URL("https://free-ff-api-src-5plp.onrender.com/api/v1/account");
  onrender.searchParams.set("region", "ID");
  onrender.searchParams.set("uid", uid);

  // Do not force a region on this provider; doing so may exclude Indonesian accounts.
  const squareweb = new URL("https://freefirefwx-beta.squareweb.app/api/nick");
  squareweb.searchParams.set("id", uid);

  const freefireapis = new URL("https://freefireapis.lat/info-player");
  freefireapis.searchParams.set("uid", uid);
  freefireapis.searchParams.set("region", "ID");

  const results = await Promise.allSettled(
    [onrender, squareweb, freefireapis].map((url) => readLegacyNickname(url, uid)),
  );
  const nickname = results
    .filter((result): result is PromiseFulfilledResult<string | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .find((value): value is string => Boolean(value));

  if (!nickname) {
    return NextResponse.json(
      {
        ok: false,
        message: omegaKey
          ? "Belum berhasil membaca nickname dari layanan cek ID. Coba lagi nanti."
          : "Layanan cek ID belum berhasil dihubungi. Periksa konfigurasi API atau coba lagi nanti.",
      },
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
