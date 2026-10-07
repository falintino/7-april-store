"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Phone, ShieldCheck } from "lucide-react";

export default function LengkapiAkunGooglePage() {
  const router = useRouter();

  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const trimmedWhatsapp = whatsapp.trim();

    if (!/^0\d{9,12}$/.test(trimmedWhatsapp)) {
      setMessage(
        "Masukkan nomor WhatsApp yang valid. Contoh: 0895704041437.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsapp: trimmedWhatsapp,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setMessage(
          result.message ??
            "Akun Google belum dapat diselesaikan. Silakan coba lagi.",
        );
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
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-blue-950/30">
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 sm:p-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-slate-950/20 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-blue-600 shadow-lg">
                7A
              </div>

              <div>
                <p className="font-bold text-white">7 April Store</p>
                <p className="text-xs text-blue-100">
                  Layanan Top Up Game
                </p>
              </div>
            </Link>

            <div className="mt-12">
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-white">
                HAMPIR SELESAI
              </span>

              <h1 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl">
                Lengkapi akun Google kamu
              </h1>

              <p className="mt-4 max-w-xl leading-7 text-blue-50/90">
                Akun Google berhasil diverifikasi. Tinggal masukkan nomor
                WhatsApp agar akun 7 April Store bisa digunakan untuk transaksi
                dan menerima informasi pesanan.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3 text-sm text-white">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>
                Nomor WhatsApp digunakan sebagai kontak transaksi.
              </span>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-400">
              Verifikasi kontak
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Masukkan nomor WhatsApp
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Gunakan nomor WhatsApp yang aktif agar mudah dihubungi terkait
              transaksi.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                    placeholder="Contoh: 0895704041437"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-900 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Gunakan format 08xxxxxxxxxx.
                </p>
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
                {isLoading ? "Menyelesaikan akun..." : "Lanjutkan"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Dengan melanjutkan, akun Google kamu akan digunakan sebagai akun
              pelanggan 7 April Store.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}