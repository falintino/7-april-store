"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(result.message ?? "Permintaan reset gagal.");
        return;
      }

      setSent(true);
      setMessage(
        result.message ??
          "Kalau email tersebut terdaftar, link reset sudah dikirim.",
      );
    } catch {
      setMessage("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#030712] px-5 py-10 sm:px-6 sm:py-16">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke login
        </Link>

        <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-3xl font-black text-white">
          Lupa kata sandi?
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Masukkan email akunmu. Kami akan mengirim link untuk membuat kata
          sandi baru.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-200">
              Email
            </span>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                required
                disabled={sent}
                className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
              />
            </div>
          </label>

          {message && (
            <p className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm leading-6 text-blue-200">
              {message}
            </p>
          )}

          {!sent && (
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Mengirim..." : "Kirim Link Reset"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          )}
        </form>

        <p className="mt-8 text-center text-xs leading-5 text-slate-500">
          Demi keamanan, website tidak akan memberi tahu apakah sebuah email
          terdaftar.
        </p>
      </section>
    </main>
  );
}
