
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

type LookupResult =
  | { status: "success"; nickname: string; region?: string }
  | { status: "invalid" }
  | { status: "unavailable" };

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
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  )?.trim() ?? null;
}

function isExplicitInvalid(data: any): boolean {
  const messages = [
    data?.message,
    data?.error,
    data?.detail,
    data?.msg,
    data?.data?.message,
    data?.data?.error,
  ];

  const message = messages
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return /invalid\s*(uid|id|user|account)|(?:uid|id|akun|player|user|account)\s*(?:tidak valid|tidak ditemukan|not found|does not exist)|wrong\s*(uid|id)|uid\s*(is\s*)?not valid/.test(message);
}

async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// PRIORITY 1: Ihsan Worker milik sendiri
async function readIhsanNickname(uid: string): Promise<LookupResult> {
  try {
    const url = new URL("https://validator.falintino10.workers.dev/ff");
    url.searchParams.set("id", uid);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(9000),
    });

    const data = await readJson(response);

    if (isExplicitInvalid(data)) {
      return { status: "invalid" };
    }

    const nickname =
      typeof data?.name === "string" ? data.name.trim() : "";

    const returnedId = String(data?.id ?? "");

    if (
      response.ok &&
      data?.success === true &&
      nickname &&
      (!returnedId || returnedId === uid)
    ) {
      return { status: "success", nickname, region: "ID" };
    }

    // Pesan "Not found" dari Worker bisa berasal dari gangguan
    // upstream, jadi tidak otomatis dianggap UID tidak valid.
    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

// PRIORITY 2: GoPay langsung
async function readGopayNickname(uid: string): Promise<LookupResult> {
  try {
    const url = new URL(
      "https://gopay.co.id/games/v1/order/prepare/FREEFIRE",
    );
    url.searchParams.set("userId", uid);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(9000),
    });

    const data = await readJson(response);

    if (isExplicitInvalid(data)) {
      return { status: "invalid" };
    }

    const nickname =
      typeof data?.data === "string" ? data.data.trim() : "";

    if (response.ok && nickname) {
      return { status: "success", nickname, region: "ID" };
    }

    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

// PRIORITY 3: Cutiezy
async function readCutiezyNickname(
  uid: string,
  apiKey: string,
): Promise<LookupResult> {
  try {
    const url = new URL(
      "https://api.cutiezy.id/api/check/games/free-fire",
    );
    url.searchParams.set("user_id", uid);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const data = await readJson(response);

    if (isExplicitInvalid(data)) {
      return { status: "invalid" };
    }

    const returnedId = String(data?.data?.id ?? "");
    const nickname =
      typeof data?.data?.nickname === "string"
        ? data.data.nickname.trim()
        : "";

    if (
      response.ok &&
      data?.success === true &&
      data?.ok === true &&
      nickname &&
      (!returnedId || returnedId === uid)
    ) {
      return {
        status: "success",
        nickname,
        region: String(data?.data?.country_code ?? "ID").trim() || "ID",
      };
    }

    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

// Cadangan lama: OmegaTronik
async function readOmegaNickname(
  uid: string,
  apiKey: string,
): Promise<string | null> {
  const url = new URL(
    "https://api.omegatronik.co.id/api/game/freefire-dg",
  );
  url.searchParams.set("id", uid);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return null;

  return findNickname(await readJson(response));
}

// Cadangan lama: API publik
async function readLegacyNickname(
  url: URL,
  uid: string,
): Promise<string | null> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) return null;

  const data: any = await readJson(response);
  const basic =
    data?.basicInfo ??
    data?.result?.basicInfo ??
    data?.accountBasicInfo?.[0];

  const nickname =
    findNickname(data) ??
    (typeof basic?.nickname === "string"
      ? basic.nickname.trim()
      : null);

  const accountId = String(
    basic?.accountId ??
      basic?.account_id ??
      data?.account_id ??
      data?.uid ??
      data?.account_uid ??
      "",
  );

  if (!nickname || (accountId && accountId !== uid)) return null;

  return nickname;
}

export async function GET(request: NextRequest) {
  const uid = (
    request.nextUrl.searchParams.get("uid") ?? ""
  ).trim();

  if (!/^\d{6,20}$/.test(uid)) {
    return NextResponse.json(
      { ok: false, message: "UID harus berupa 6–20 digit angka." },
      { status: 400, headers: noStore },
    );
  }

  // 1. Ihsan Worker
  const ihsan = await readIhsanNickname(uid);

  if (ihsan.status === "success") {
    return NextResponse.json(
      {
        ok: true,
        uid,
        nickname: ihsan.nickname,
        region: ihsan.region ?? "ID",
        provider: "ihsan",
      },
      { headers: noStore },
    );
  }

  if (ihsan.status === "invalid") {
    return NextResponse.json(
      { ok: false, message: "UID Free Fire tidak valid." },
      { status: 400, headers: noStore },
    );
  }

  // 2. GoPay langsung
  const gopay = await readGopayNickname(uid);

  if (gopay.status === "success") {
    return NextResponse.json(
      {
        ok: true,
        uid,
        nickname: gopay.nickname,
        region: gopay.region ?? "ID",
        provider: "gopay",
      },
      { headers: noStore },
    );
  }

  if (gopay.status === "invalid") {
    return NextResponse.json(
      { ok: false, message: "UID Free Fire tidak valid." },
      { status: 400, headers: noStore },
    );
  }

  // 3. Cutiezy
  const cutiezyKey = process.env.CUTIEZY_API_KEY?.trim();

  if (cutiezyKey) {
    const cutiezy = await readCutiezyNickname(uid, cutiezyKey);

    if (cutiezy.status === "success") {
      return NextResponse.json(
        {
          ok: true,
          uid,
          nickname: cutiezy.nickname,
          region: cutiezy.region ?? "ID",
          provider: "cutiezy",
        },
        { headers: noStore },
      );
    }

    if (cutiezy.status === "invalid") {
      return NextResponse.json(
        { ok: false, message: "UID Free Fire tidak valid." },
        { status: 400, headers: noStore },
      );
    }
  }

  // 4. Cadangan lama: OmegaTronik
  const omegaKey = process.env.OMEGATRONIK_API_KEY?.trim();

  if (omegaKey) {
    try {
      const nickname = await readOmegaNickname(uid, omegaKey);

      if (nickname) {
        return NextResponse.json(
          { ok: true, uid, nickname, region: "ID" },
          { headers: noStore },
        );
      }
    } catch {
      // Lanjutkan ke API lama.
    }
  }

  // 5. Cadangan API publik lama
  const onrender = new URL(
    "https://free-ff-api-src-5plp.onrender.com/api/v1/account",
  );
  onrender.searchParams.set("region", "ID");
  onrender.searchParams.set("uid", uid);

  const squareweb = new URL(
    "https://freefirefwx-beta.squareweb.app/api/nick",
  );
  squareweb.searchParams.set("id", uid);

  const freefireapis = new URL(
    "https://freefireapis.lat/info-player",
  );
  freefireapis.searchParams.set("uid", uid);
  freefireapis.searchParams.set("region", "ID");

  const results = await Promise.allSettled(
    [onrender, squareweb, freefireapis].map((url) =>
      readLegacyNickname(url, uid),
    ),
  );

  const nickname = results
    .filter(
      (result): result is PromiseFulfilledResult<string | null> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value)
    .find((value): value is string => Boolean(value));

  if (!nickname) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Semua layanan cek ID belum berhasil membaca nickname. Silakan coba lagi nanti.",
      },
      { status: 503, headers: noStore },
    );
  }

  return NextResponse.json(
    { ok: true, uid, nickname, region: "ID" },
    { headers: noStore },
  );
}
