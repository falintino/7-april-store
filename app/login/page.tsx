"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error) {
      setMessage(error);

      window.history.replaceState(
        {},
        "",
        window.location.pathname,
      );
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setMessage(result.message ?? "Login gagal. Silakan coba lagi.");
        return;
      }

      router.replace("/profil");
      router.refresh();
    } catch {
      setMessage("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#030712] px-5 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-blue-950/30 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-900 via-blue-950 to-blue-700 p-8 sm:p-10 lg:border-b-0 lg:border-r">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-600/25 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-600/30">
                7A
              </div>

              <div>
                <p className="font-bold text-white">7 April Store</p>
                <p className="text-xs text-slate-400">
                  Layanan Top Up Game
                </p>
              </div>
            </Link>

            <div className="mt-14">
              <span className="rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-100">
                SELAMAT DATANG KEMBALI
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight text-white">
                Masuk dan pantau semua pesananmu.
              </h1>

              <p className="mt-4 leading-7 text-slate-300">
                Lihat status top up, riwayat transaksi, dan data akunmu di
                satu tempat.
              </p>
            </div>

            <div className="mt-10 space-y-4 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-blue-300" />
                Sesi login tersimpan dengan aman
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-blue-300" />
                Pesanan hanya bisa dilihat oleh pemilik akun
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-400">
              Login pelanggan
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Masuk ke akunmu
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Gunakan email dan password atau akun Google kamu.
            </p>

            <a
              href="/api/auth/google"
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M21.35 12.27c0-.78-.07-1.53-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.42Z"
                />
                <path
                  fill="#34A853"
                  d="M12 21.5c2.64 0 4.86-.87 6.48-2.35l-3.14-2.45c-.87.58-1.98.92-3.34.92-2.56 0-4.73-1.73-5.51-4.06H3.25v2.53A9.8 9.8 0 0 0 12 21.5Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.49 13.56A5.9 5.9 0 0 1 6.18 12c0-.54.11-1.07.31-1.56V7.9H3.25A9.5 9.5 0 0 0 2.25 12c0 1.47.35 2.86 1 4.1l3.24-2.54Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.38c1.44 0 2.73.5 3.75 1.48l2.81-2.82C16.86 3.43 14.64 2.5 12 2.5a9.8 9.8 0 0 0-8.75 5.4l3.24 2.54C7.27 8.11 9.44 6.38 12 6.38Z"
                />
              </svg>

              Lanjutkan dengan Google
            </a>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                atau
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-200">
                  Password
                </span>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
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
                {isLoading ? "Memproses..." : "Login"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="text-center">
                <Link
                  href="/lupa-password"
                  className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Lupa kata sandi?
                </Link>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Belum punya akun?{" "}
              <Link
                href="/daftar"
                className="font-bold text-blue-400 transition hover:text-blue-300"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}