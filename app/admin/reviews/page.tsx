import crypto from "crypto";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ReviewModeration from "./ReviewModeration";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isValidAdminSession(token?: string) {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !password || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(password).digest("hex");
  return safeEqual(token, expected);
}

export default async function AdminReviewsPage() {
  const token = (await cookies()).get("admin_session")?.value;
  if (!isValidAdminSession(token)) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-[#060b16] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Admin 7 April Store</p>
            <h1 className="mt-2 text-3xl font-black">Moderasi Rating & Ulasan</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Rating 1–4 masuk antrean pemeriksaan. Hubungi pembeli jika perlu, lalu tampilkan atau sembunyikan ulasannya dengan alasan yang tercatat.</p>
          </div>
          <Link href="/admin" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-bold hover:bg-white/10">← Dashboard</Link>
        </header>
        <ReviewModeration />
      </div>
    </main>
  );
}
