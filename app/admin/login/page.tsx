"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!password.trim()) {
      setErrorMessage(
        "Masukkan password admin."
      );

      return;
    }

    try {
      setLoading(true);

      setErrorMessage("");

      const response =
        await fetch(
          "/api/admin/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                password,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Login admin gagal."
        );
      }

      router.replace(
        "/admin"
      );

      router.refresh();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Terjadi kesalahan saat login."
        );
      }

      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black shadow-lg shadow-blue-600/20">
                7A
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">
                  7 APRIL STORE
                </p>

                <h1 className="mt-1 text-2xl font-black">
                  Admin Login
                </h1>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              Masukkan password admin untuk
              membuka dashboard transaksi.
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="p-6 sm:p-8"
          >
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-bold text-slate-300"
            >
              Password Admin
            </label>

            <input
              id="admin-password"
              type="password"
              value={password}
              disabled={loading}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );

                setErrorMessage(
                  ""
                );
              }}
              autoComplete="current-password"
              placeholder="Masukkan password"
              className="h-13 w-full rounded-xl border border-white/10 bg-[#060b16] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !password.trim()
              }
              className={[
                "mt-5 h-13 w-full rounded-xl text-sm font-black transition",

                loading ||
                !password.trim()
                  ? "cursor-not-allowed bg-blue-600/20 text-white/30"
                  : "bg-blue-600 text-white hover:bg-blue-500",
              ].join(" ")}
            >
              {loading
                ? "Memeriksa..."
                : "Masuk ke Dashboard"}
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-slate-600">
              Akses dashboard hanya untuk
              administrator.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}