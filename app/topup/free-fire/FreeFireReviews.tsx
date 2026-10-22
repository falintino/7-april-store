"use client";

import { FormEvent, useEffect, useState } from "react";

type Review = { id: string; rating: number; comment: string; displayName: string; createdAt: string };
type ReviewData = { count: number; average: number; reviews: Review[] };

function Stars({ rating }: { rating: number }) {
  return <span aria-label={`${rating} dari 5 bintang`} className="tracking-widest text-amber-400">{Array.from({ length: 5 }, (_, i) => i < rating ? "★" : "☆").join("")}</span>;
}

export default function FreeFireReviews() {
  const [data, setData] = useState<ReviewData>({ count: 0, average: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState("");
  const [uid, setUid] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadReviews() {
    try {
      const response = await fetch("/api/free-fire/reviews", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json() as ReviewData;
      setData(result);
    } catch {
      // Ulasan tidak boleh mengganggu checkout.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadReviews(); }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/free-fire/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice, uid, displayName, rating, comment }),
      });
      const result = await response.json() as { message?: string };
      setMessage(result.message ?? (response.ok ? "Ulasan terkirim." : "Ulasan gagal dikirim."));
      if (response.ok) {
        setInvoice(""); setUid(""); setDisplayName(""); setComment("");
        await loadReviews();
      }
    } catch {
      setMessage("Koneksi gagal. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-5xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
        <div className="grid gap-5 border-b border-white/10 bg-gradient-to-r from-blue-950/80 via-slate-900 to-amber-950/40 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">Ulasan pembeli terverifikasi</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Rating & Ulasan Pelanggan</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Ulasan hanya dapat dikirim menggunakan invoice dan UID dari transaksi Free Fire yang berhasil.</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-black/20 px-5 py-4 text-center">
            <p className="text-4xl font-black text-white">{data.count ? data.average.toFixed(1) : "—"}</p>
            <Stars rating={data.count ? Math.round(data.average) : 0} />
            <p className="mt-1 text-xs text-slate-400">{data.count} ulasan terverifikasi</p>
          </div>
        </div>
        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7">
          <div className="space-y-3">
            <h3 className="font-bold text-white">Ulasan terbaru</h3>
            {loading ? <p className="text-sm text-slate-400">Memuat ulasan…</p> : data.reviews.length ? data.reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-white">{review.displayName}</p><Stars rating={review.rating} /></div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{review.comment}</p>
                <p className="mt-2 text-xs text-slate-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(review.createdAt))}</p>
              </article>
            )) : <div className="rounded-xl border border-dashed border-white/15 p-5"><p className="font-semibold text-slate-200">Belum ada ulasan</p><p className="mt-1 text-sm leading-6 text-slate-400">Jadilah pembeli pertama yang membagikan pengalaman setelah transaksi berhasil.</p></div>}
          </div>
          <form onSubmit={submitReview} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <h3 className="font-bold text-white">Tulis ulasan pembelian</h3>
            <label className="block text-sm text-slate-300">Nomor invoice
              <input required value={invoice} onChange={(e) => setInvoice(e.target.value)} maxLength={100} placeholder="Contoh: INV-..." className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
            </label>
            <label className="block text-sm text-slate-300">UID Free Fire
              <input required value={uid} onChange={(e) => setUid(e.target.value.replace(/\D/g, "").slice(0, 20))} inputMode="numeric" minLength={6} maxLength={20} placeholder="UID yang digunakan saat order" className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
            </label>
            <label className="block text-sm text-slate-300">Nama tampilan (opsional)
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} placeholder="Pelanggan" className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
            </label>
            <div><p className="mb-1.5 text-sm text-slate-300">Rating kamu</p><div className="flex gap-1">{[1,2,3,4,5].map((n) => <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} bintang`} className={`text-3xl transition ${n <= rating ? "text-amber-400" : "text-slate-600"}`}>★</button>)}</div></div>
            <label className="block text-sm text-slate-300">Ulasan
              <textarea required minLength={5} maxLength={500} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ceritakan pengalaman top up kamu…" className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
            </label>
            {message && <p role="status" className="text-sm text-blue-300">{message}</p>}
            <button disabled={submitting} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Mengirim…" : "Kirim Ulasan"}</button>
            <p className="text-xs leading-5 text-slate-500">Invoice dan UID hanya dipakai untuk memverifikasi transaksi, tidak ditampilkan pada ulasan publik.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
