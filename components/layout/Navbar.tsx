"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  CircleHelp,
  Handshake,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const whatsappUrl = "https://wa.me/6285960237306";

const mainMenuItems = [
  { label: "Beranda", href: "/" },
  { label: "Top Up", href: "/topup" },
  { label: "Jual Beli Akun", href: "/akun" },
  { label: "Rekber", href: "/rekber" },
  { label: "Rental", href: "/rental" },
];

const additionalMenuItems = [
  {
    label: "Promo",
    description: "Promo terbatas dari 7 April Store",
    comingSoon: true,
  },
  {
    label: "Affiliate",
    description: "Program affiliate 7 April Store",
    comingSoon: true,
  },
  {
    label: "Berita",
    description: "Update dan pengumuman terbaru",
    comingSoon: true,
  },
  {
    label: "Kerja Sama",
    description: "Endorsement, banner, dan partnership",
    href: whatsappUrl,
    external: true,
    icon: Handshake,
  },
  {
    label: "Bantuan",
    description: "Hubungi Customer Service",
    href: whatsappUrl,
    external: true,
    icon: CircleHelp,
  },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030712]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/30">
            7A
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">7 April Store</h1>
            <p className="text-xs text-slate-400">Gaming Marketplace</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 xl:flex">
          {mainMenuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-slate-300 transition hover:text-blue-500"
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="text-sm text-slate-300 transition hover:text-blue-500"
          >
            Lainnya
          </button>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-slate-300"
            aria-label="Cari"
          >
            <Search size={20} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-slate-300"
            aria-label="Keranjang"
          >
            <ShoppingCart size={20} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden text-slate-300 sm:inline-flex"
            aria-label="Akun"
          >
            <User size={20} />
          </Button>

          <Button className="hidden rounded-xl bg-blue-600 px-6 hover:bg-blue-500 md:flex">
            Login
          </Button>

          <Button
            variant="outline"
            className="hidden rounded-xl border-blue-600 text-white hover:bg-blue-600 hover:text-white md:flex"
          >
            Daftar
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="rounded-xl border border-white/10 text-white hover:bg-white/10 xl:hidden"
            aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="max-h-[calc(100vh-80px)] overflow-y-auto border-t border-white/10 bg-[#07101f] px-5 py-5 shadow-2xl">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              Layanan 7 April Store
            </p>

            <nav className="grid gap-2">
              {mainMenuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
                >
                  {item.label}
                  <ChevronRight size={18} className="text-slate-500" />
                </Link>
              ))}
            </nav>

            <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              Lainnya
            </p>

            <div className="grid gap-2">
              {additionalMenuItems.map((item) => {
                const Icon = item.icon;

                if (item.comingSoon) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-300">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-300">
                        Segera Hadir
                      </span>
                    </div>
                  );
                }

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 transition hover:border-blue-500/40 hover:bg-blue-500/10"
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon size={19} className="text-blue-400" />}

                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={18} className="text-slate-500" />
                  </a>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-5">
              <Button
                type="button"
                onClick={closeMenu}
                className="rounded-xl bg-blue-600 py-5 font-bold hover:bg-blue-500"
              >
                Login
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={closeMenu}
                className="rounded-xl border-blue-600 py-5 font-bold text-white hover:bg-blue-600 hover:text-white"
              >
                Daftar
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}