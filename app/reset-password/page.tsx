"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Link reset tidak valid.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password minimal terdiri dari 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Konfirmasi password belum sama.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(result.message ?? "Reset kata sandi gagal.");
        return;
      }

      setSuccess(true);
      setMessage(
        result.message ?? "Kata sandi berhasil diubah. Silakan login kembali.",
      );
    } catch {
      setMessage("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-red-500/20 bg-slate-950 p-8 text-center">
        <h1 className="text-2xl font-black text-white">Link tidak valid</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Buka kembali link reset password yang dikirim ke email kamu.
        </p>
        <Link
          href="/lupa-password"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
        >
          Minta link baru
        </Link>
      </section>
    );
  }

  if (success) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-emerald-500/20 bg-slate-950 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-white">
          Kata sandi berhasil diubah
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Sekarang kamu bisa login menggunakan password baru.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
        >
          Login
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
        <LockKeyhole className="h-7 w-7" />
      </div>

      <h1 className="mt-6 text-3xl font-black text-white">
        Buat kata sandi baru
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        Gunakan minimal 8 karakter. Link ini hanya dapat digunakan satu kali
        dan berlaku selama 30 menit.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-200">
            Password baru
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-200">
            Konfirmasi password
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Ulangi password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        {message && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#030712] px-5 py-10 sm:px-6 sm:py-16">
      <Suspense fallback={<div className="mx-auto max-w-xl text-center text-slate-400">Memuat...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
