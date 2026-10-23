"use client";

import { useCallback, useEffect, useState } from "react";

type Audit = { action: string; reason: string | null; adminIdentifier: string; createdAt: string };
type Review = {
  id: string; rating: number; comment: string; displayName: string; approved: boolean;
  moderationStatus: string; moderationReason: string | null; moderatedAt: string | null; moderatedBy: string | null; createdAt: string;
  order: { invoice: string; uid: string; whatsapp: string; paymentStatus: string; providerStatus: string; product: { name: string } };
  auditLogs: Audit[];
};

function date(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)) + " WIB";
}

export default function ReviewModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/reviews", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal memuat ulasan.");
      setReviews(result.reviews as Review[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat ulasan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function moderate(review: Review, action: "publish" | "hide" | "pending") {
    const reason = (reasons[review.id] ?? "").trim();
    if (action === "hide" && reason.length < 5) {
      setMessage("Isi alasan minimal 5 karakter sebelum menyembunyikan ulasan.");
      return;
    }
    setBusyId(review.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, action, reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Tindakan gagal.");
      setMessage(result.message || "Perubahan tersimpan.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tindakan gagal.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p className="rounded-2xl border border-white/10 p-6 text-slate-300">Memuat ulasan…</p>;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-amber-300">Perlu diperiksa: {reviews.filter((r) => r.moderationStatus === "PENDING_REVIEW").length}</span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">Tampil: {reviews.filter((r) => r.moderationStatus === "VISIBLE" && r.approved).length}</span>
        <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-red-300">Disembunyikan: {reviews.filter((r) => r.moderationStatus === "HIDDEN").length}</span>
      </div>
      {message && <p role="status" className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-3 text-sm text-blue-200">{message}</p>}
      {reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400">Belum ada ulasan.</div> : reviews.map((review) => (
        <article key={review.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold">{review.displayName}</h2>
                <span className="text-amber-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${review.moderationStatus === "VISIBLE" ? "bg-emerald-400/10 text-emerald-300" : review.moderationStatus === "HIDDEN" ? "bg-red-400/10 text-red-300" : "bg-amber-400/10 text-amber-300"}`}>{review.moderationStatus}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{review.comment}</p>
              <p className="mt-2 text-xs text-slate-500">{date(review.createdAt)} · {review.order.product.name}</p>
            </div>
            <a className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-bold text-green-300 hover:bg-green-500/20" href={`https://wa.me/${review.order.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Halo, Kak. Kami dari 7 April Store ingin menindaklanjuti ulasan ${review.rating} bintang untuk pesanan ${review.order.invoice}. Boleh tahu kendala yang Kakak alami? Masukan Kakak membantu kami memperbaiki layanan. Terima kasih.`)}`} target="_blank" rel="noreferrer">Hubungi WhatsApp ↗</a>
          </div>
          <dl className="mt-4 grid gap-2 rounded-xl bg-black/20 p-3 text-xs sm:grid-cols-2">
            <div><dt className="text-slate-500">Invoice</dt><dd className="mt-1 break-all text-slate-200">{review.order.invoice}</dd></div>
            <div><dt className="text-slate-500">UID Free Fire</dt><dd className="mt-1 text-slate-200">{review.order.uid}</dd></div>
            <div><dt className="text-slate-500">Status pembayaran</dt><dd className="mt-1 text-slate-200">{review.order.paymentStatus}</dd></div>
            <div><dt className="text-slate-500">Status top up</dt><dd className="mt-1 text-slate-200">{review.order.providerStatus}</dd></div>
          </dl>
          {review.moderationReason && <p className="mt-3 text-xs text-slate-400">Alasan terakhir: {review.moderationReason}</p>}
          <label className="mt-4 block text-sm text-slate-300">Alasan tindakan admin (wajib jika menyembunyikan)
            <textarea value={reasons[review.id] ?? ""} onChange={(e) => setReasons((current) => ({ ...current, [review.id]: e.target.value.slice(0, 500) }))} rows={2} maxLength={500} placeholder="Contoh: berisi spam atau data pribadi…" className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {review.moderationStatus !== "VISIBLE" && <button disabled={busyId === review.id} onClick={() => void moderate(review, "publish")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold disabled:opacity-50">Setujui & tampilkan</button>}
            {review.moderationStatus !== "HIDDEN" && <button disabled={busyId === review.id} onClick={() => void moderate(review, "hide")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold disabled:opacity-50">Sembunyikan</button>}
            {review.moderationStatus !== "PENDING_REVIEW" && <button disabled={busyId === review.id} onClick={() => void moderate(review, "pending")} className="rounded-xl border border-amber-400/30 px-4 py-2 text-sm font-bold text-amber-300 disabled:opacity-50">Kembalikan ke pemeriksaan</button>}
          </div>
          {review.auditLogs.length > 0 && <details className="mt-4 rounded-xl border border-white/10 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-300">Riwayat tindakan ({review.auditLogs.length})</summary><ul className="mt-3 space-y-2">{review.auditLogs.map((log, index) => <li key={`${log.createdAt}-${index}`} className="text-xs leading-5 text-slate-400">{date(log.createdAt)} · {log.action} · {log.adminIdentifier}{log.reason ? ` · ${log.reason}` : ""}</li>)}</ul></details>}
        </article>
      ))}
      <button onClick={() => void load()} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/5">Muat ulang</button>
    </section>
  );
}
