"use client";

import Link from "next/link";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030712]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/30">
            7A
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">
              7 April Store
            </h1>

            <p className="text-xs text-slate-400">
              Gaming Marketplace
            </p>
          </div>
        </Link>

        {/* Menu */}
        <nav className="hidden items-center gap-8 lg:flex">
          <Link href="/" className="text-sm text-slate-300 transition hover:text-blue-500">
            Beranda
          </Link>

          <Link href="/topup" className="text-sm text-slate-300 transition hover:text-blue-500">
            Top Up
          </Link>

          <Link href="/jual-akun" className="text-sm text-slate-300 transition hover:text-blue-500">
            Jual Akun
          </Link>

          <Link href="/rekber" className="text-sm text-slate-300 transition hover:text-blue-500">
            Rekber
          </Link>

          <Link href="/rental" className="text-sm text-slate-300 transition hover:text-blue-500">
            Rental
          </Link>

          <Link href="/promo" className="text-sm text-slate-300 transition hover:text-blue-500">
            Promo
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300"
          >
            <Search size={20} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300"
          >
            <ShoppingCart size={20} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300"
          >
            <User size={20} />
          </Button>

          <Button className="hidden rounded-xl bg-blue-600 px-6 hover:bg-blue-500 md:flex">
            Login
          </Button>

          <Button
            variant="outline"
            className="hidden rounded-xl border-blue-600 text-white md:flex"
          >
            Daftar
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
          >
            <Menu />
          </Button>

        </div>

      </div>
    </header>
  );
}