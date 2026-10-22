"use client";

import { FormEvent, useState } from "react";

type Props = {
  invoice: string;
  uid: string;
};

export default function OrderReviewForm({ invoice, uid }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      if (response.ok) setSubmitted(true);
    } catch {
      setMessage("Koneksi gagal. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-slate-900/80 p-5 sm:p-6">
      {submitted ? (
        <div role="status" className="py-3 text-center">
          <p className="text-xl font-black text-emerald-400">Terima kasih atas ulasanmu! 💙</p>
          <p className="mt-2 text-sm text-slate-300">Rating dan ulasan kamu berhasil dikirim.</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Transaksi berhasil</p>
          <h2 className="mt-2 text-xl font-black text-white">Bagaimana pengalaman top up kamu?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Beri rating dan ulasan singkat. Nomor pesanan dan UID sudah terisi otomatis—kamu tidak perlu mencarinya.</p>

          <form onSubmit={submitReview} className="mt-5 space-y-4">
            <div>
              <p className="mb-2 text-sm text-slate-300">Rating kamu</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} bintang`} aria-pressed={n === rating} className={`text-3xl transition ${n <= rating ? "text-amber-400" : "text-slate-600"}`}>★</button>
                ))}
              </div>
            </div>

            <label className="block text-sm text-slate-300">Nama tampilan (opsional)
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} placeholder="Pelanggan" className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
            </label>

            <label className="block text-sm text-slate-300">Ulasan
              <textarea required minLength={5} maxLength={500} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ceritakan pengalaman top up kamu…" className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500" />
            </label>

            {message && <p role="status" className="text-sm text-blue-300">{message}</p>}
            <button disabled={submitting} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Mengirim…" : "Kirim Rating & Ulasan"}</button>
          </form>
        </>
      )}
    </section>
  );
}
