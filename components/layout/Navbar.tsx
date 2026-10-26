"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  CircleHelp,
  MessageCircle,
  Menu,
  User,
  X,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const mainMenuItems = [
  {
    label: "Beranda",
    href: "/",
  },
  {
    label: "Top Up",
    href: "/topup",
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
  },
];

const additionalMenuItems = [
  {
    label: "Bantuan",
    description: "Hubungi Customer Service",
    href: "/contact",
    icon: CircleHelp,
  },
];

type Customer = {
  id: string;
  name: string;
  email: string;
};

export default function Navbar() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [isSupportOpen, setIsSupportOpen] =
    useState(false);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [isLoadingCustomer, setIsLoadingCustomer] =
    useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadCustomer() {
      setIsLoadingCustomer(true);

      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as {
            customer: Customer | null;
          };

        if (isActive) {
          setCustomer(
            result.customer ?? null,
          );
        }
      } catch {
        if (isActive) {
          setCustomer(null);
        }
      } finally {
        if (isActive) {
          setIsLoadingCustomer(false);
        }
      }
    }

    void loadCustomer();

    return () => {
      isActive = false;
    };
  }, [pathname]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  const customerFirstName =
    customer?.name.split(" ")[0] ?? "";

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030712]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#030712] shadow-lg shadow-blue-600/30 ring-1 ring-blue-500/40">
            <img
              src="/7a-neon-logo.jpg"
              alt="Logo 7A"
              width="48"
              height="48"
              className="h-12 w-12 object-contain"
            />
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">
              7 April Store
            </h1>

            <p className="text-xs text-slate-400">
              Layanan Top Up Game
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 xl:flex">
          {mainMenuItems.map(
            (item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="text-sm text-slate-300 transition hover:text-blue-500"
              >
                {item.label}
              </Link>
            ),
          )}

          <Link
            href="/contact"
            onClick={closeMenu}
            className="text-sm text-slate-300 transition hover:text-blue-500"
          >
            Bantuan
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/profil"
            onClick={closeMenu}
            className="hidden h-10 w-10 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            aria-label="Akun saya"
          >
            <User size={20} />
          </Link>

          {isLoadingCustomer ? (
            <div className="hidden h-10 w-24 animate-pulse rounded-xl bg-white/[0.06] md:block" />
          ) : customer ? (
            <Link
              href="/profil"
              onClick={closeMenu}
              className="hidden max-w-40 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 md:inline-flex"
            >
              <User size={17} />

              <span className="truncate">
                Halo, {customerFirstName}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeMenu}
                className="hidden rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 md:inline-flex"
              >
                Login
              </Link>

              <Link
                href="/daftar"
                onClick={closeMenu}
                className="hidden rounded-xl border border-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 md:inline-flex"
              >
                Daftar
              </Link>
            </>
          )}

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() =>
              setIsMenuOpen(
                (current) => !current,
              )
            }
            className="rounded-xl border border-white/10 text-white hover:bg-white/10 xl:hidden"
            aria-label={
              isMenuOpen
                ? "Tutup menu"
                : "Buka menu"
            }
            aria-expanded={
              isMenuOpen
            }
          >
            {isMenuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="max-h-[calc(100vh-80px)] overflow-y-auto border-t border-white/10 bg-[#07101f] px-5 py-5 shadow-2xl">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              7 April Store × Store Falintino
            </p>

            <nav className="grid gap-2">
              {mainMenuItems.map(
                (item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
                  >
                    {item.label}

                    <ChevronRight
                      size={18}
                      className="text-slate-500"
                    />
                  </Link>
                ),
              )}

              <Link
                href="/profil"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20"
              >
                <span className="flex items-center gap-3">
                  <User
                    size={19}
                    className="text-blue-400"
                  />

                  {customer
                    ? `Halo, ${customerFirstName}`
                    : "Akun Saya & Pesanan"}
                </span>

                <ChevronRight
                  size={18}
                  className="text-blue-300"
                />
              </Link>
            </nav>

            <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              Bantuan
            </p>

            <div className="grid gap-2">
              {additionalMenuItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <Link
                      key={
                        item.label
                      }
                      href={item.href}
                      onClick={
                        closeMenu
                      }
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 transition hover:border-blue-500/40 hover:bg-blue-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={19}
                          className="text-blue-400"
                        />

                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            {
                              item.label
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              item.description
                            }
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-500"
                      />
                    </Link>
                  );
                },
              )}
            </div>

            <div className="mt-5 border-t border-white/[0.08] pt-5">
              {customer ? (
                <Link
                  href="/profil"
                  onClick={
                    closeMenu
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  <User size={18} />
                  Buka Akun Saya
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={
                      closeMenu
                    }
                    className="flex items-center justify-center rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    Login
                  </Link>

                  <Link
                    href="/daftar"
                    onClick={
                      closeMenu
                    }
                    className="flex items-center justify-center rounded-xl border border-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-600"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </header>

      {!pathname.startsWith("/admin") && (
        <div className="fixed bottom-5 right-4 z-[70] sm:bottom-6 sm:right-6">
          {isSupportOpen && (
            <section
              aria-label="Pusat bantuan 7 April Store"
              className="mb-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-blue-400/20 bg-[#07101f] text-white shadow-2xl shadow-black/50"
            >
              <div className="flex items-start justify-between border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-transparent p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <MessageCircle size={21} />
                  </div>
                  <div>
                    <h2 className="font-bold">Pusat Bantuan</h2>
                    <p className="mt-1 text-xs text-slate-400">Ada kendala dengan pesananmu?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Tutup bantuan"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 p-3">
                <Link
                  href="/faq"
                  onClick={() => setIsSupportOpen(false)}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-blue-400/40 hover:bg-blue-500/10"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
                    <PackageCheck size={19} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Pembayaran berhasil, diamond belum masuk</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">Cek status top up, simpan invoice, dan jangan bayar ulang.</span>
                  </span>
                </Link>

                <Link
                  href="/faq"
                  onClick={() => setIsSupportOpen(false)}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-amber-400/40 hover:bg-amber-500/10"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                    <AlertTriangle size={19} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Sudah bayar, tetapi status gagal/pending</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">Pesanan perlu diperiksa admin. Jangan membuat pembayaran kedua.</span>
                  </span>
                </Link>

                <a
                  href="https://wa.me/6285960237306?text=Halo%207%20April%20Store%2C%20saya%20butuh%20bantuan%20pesanan.%20Saya%20sudah%20membayar%20tetapi%20ada%20kendala%20status%20atau%20pengiriman.%20Mohon%20dibantu%20cek."
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  <MessageCircle size={17} />
                  Hubungi Admin via WhatsApp
                </a>

                <p className="px-1 pb-1 text-[11px] leading-4 text-slate-500">
                  Siapkan nomor invoice dan bukti pembayaran. Jangan kirim PIN, OTP, atau kata sandi. Status pembayaran PAID tidak selalu berarti diamond sudah terkirim.
                </p>
              </div>
            </section>
          )}

          <button
            type="button"
            onClick={() => setIsSupportOpen((current) => !current)}
            aria-expanded={isSupportOpen}
            aria-label={isSupportOpen ? "Tutup pusat bantuan" : "Buka pusat bantuan"}
            className="flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {isSupportOpen ? <X size={19} /> : <CircleHelp size={20} />}
            <span>{isSupportOpen ? "Tutup" : "Bantuan Pesanan"}</span>
          </button>
        </div>
      )}
    </>
  );
}