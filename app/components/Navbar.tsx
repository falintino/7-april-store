"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-blue-900 bg-[#0A0F1F] text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo/logo7a.png"
            alt="7A Logo"
            className="w-12 h-12 object-contain"
          />

          <div>
            <h1 className="font-bold text-lg md:text-xl">
              7 APRIL STORE
            </h1>
            <p className="text-xs text-gray-400">
              Free Fire Marketplace
            </p>
          </div>
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex gap-6">
          <Link href="/">Beranda</Link>
          <Link href="/topup">Top Up FF</Link>
          <Link href="/akun">Jual Akun</Link>
          <Link href="/rekber">Rekber</Link>
          <Link href="/rental">Rental</Link>
          <Link href="/id-cantik">ID Cantik</Link>
        </div>

        {/* Tombol Hamburger */}
        <button
          className="md:hidden text-3xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden flex flex-col px-6 pb-4 gap-4">

          <Link href="/">🏠 Beranda</Link>
          <Link href="/topup">💎 Top Up FF</Link>
          <Link href="/akun">👑 Jual Akun</Link>
          <Link href="/rekber">🔒 Rekber</Link>
          <Link href="/rental">🎮 Rental</Link>
          <Link href="/id-cantik">✨ ID Cantik</Link>

        </div>
      )}
    </nav>
  );
}