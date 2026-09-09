"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

export default function DaftarPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Konfirmasi password belum sama.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          whatsapp,
          password,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setMessage(result.message ?? "Pendaftaran gagal. Silakan coba lagi.");
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
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 sm:p-10 lg:border-b-0 lg:border-r">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-slate-950/25 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-blue-600 shadow-lg">
                7A
              </div>

              <div>
                <p className="font-bold text-white">7 April Store</p>
                <p className="text-xs text-blue-100">Gaming Marketplace</p>
              </div>
            </Link>

            <div className="mt-14">
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-white">
                AKUN PELANGGAN
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight text-white">
                Daftar untuk pengalaman top up yang lebih mudah.
              </h1>

              <p className="mt-4 leading-7 text-blue-50/90">
                Simpan riwayat pesanan, pantau status top up, dan gunakan data
                akunmu untuk transaksi berikutnya.
              </p>
            </div>

            <div className="mt-10 space-y-4 text-sm text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                Password disimpan dalam bentuk aman
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                Riwayat pesanan tersimpan di akunmu
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                Lacak status pesanan dengan lebih mudah
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-400">
              Buat akun
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Daftar 7 April Store
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Isi data dengan benar. Nomor WhatsApp digunakan sebagai kontak
              transaksi.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-200">
                  Nama lengkap
                </span>

                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Masukkan nama kamu"
                    autoComplete="name"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </label>

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
                  Nomor WhatsApp
                </span>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    placeholder="Contoh: 085960237306"
                    autoComplete="tel"
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
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-200">
                  Konfirmasi password
                </span>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    minLength={8}
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
                {isLoading ? "Memproses..." : "Daftar Sekarang"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-bold text-blue-400 transition hover:text-blue-300"
              >
                Login di sini
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}