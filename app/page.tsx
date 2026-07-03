"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AOS from "aos";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  return (

    <main className="min-h-screen bg-[#0A0F1F] text-white">
      
      {/* Navbar */}
      <nav className="relative flex items-center justify-between px-8 py-5 border-b border-blue-900">
        <div className="flex items-center gap-3">
          <img
  src="/logo/logo7a.png"
  alt="7A Logo"
  className="w-14 h-14 object-contain"
/>

          <div>
            <h1 className="font-bold text-xl">7 APRIL STORE</h1>
            <p className="text-sm text-gray-400">
              Free Fire Marketplace
            </p>
          </div>
        </div>

        <div className="hidden md:flex gap-6">
  <Link href="/" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Beranda
  </Link>

  <Link href="/topup" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Top Up FF
  </Link>

  <Link href="/akun" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Jual Akun FF
  </Link>

  <Link href="/rekber" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Rekber FF
  </Link>

  <Link href="/rental" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Rental Akun
  </Link>

  <Link href="/id-cantik" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    ID Cantik FF
  </Link>

</div>

{/* Tombol Mobile */}
<button
  onClick={() => setMenuOpen(!menuOpen)}
  className="md:hidden text-3xl"
>
  ☰
</button>

{menuOpen && (
  <div className="absolute top-20 left-0 w-full bg-[#0A0F1F] border-t border-blue-900 flex flex-col items-center gap-5 py-6 md:hidden z-50">

    <Link href="/" onClick={() => setMenuOpen(false)}>
      Beranda
    </Link>

    <Link href="/topup" onClick={() => setMenuOpen(false)}>
      Top Up FF
    </Link>

    <Link href="/akun" onClick={() => setMenuOpen(false)}>
      Jual Akun FF
    </Link>

    <Link href="/rekber" onClick={() => setMenuOpen(false)}>
      Rekber FF
    </Link>

    <Link href="/rental" onClick={() => setMenuOpen(false)}>
      Rental Akun
    </Link>

    <Link href="/id-cantik" onClick={() => setMenuOpen(false)}>
      ID Cantik FF
    </Link>

  </div>
)}


      </nav>

      {/* Hero Section */}
<section className="relative overflow-hidden px-6 py-20 text-center bg-gradient-to-b from-[#0F172A] to-[#0A0F1F]">

  {/* Efek Glow */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 blur-3xl rounded-full"></div>

<img
  src="/hero/ff-hero.png"
  alt="Free Fire Hero"
  className="absolute right-10 top-1/2 -translate-y-1/2 h-[450px] opacity-90 hidden lg:block pointer-events-none"
/>

  <div className="relative z-10">

    <span className="bg-blue-600 px-4 py-2 rounded-full text-sm font-bold">
      🔥 Free Fire Marketplace Indonesia
    </span>

    <h1 className="mt-8 text-4xl md:text-6xl font-extrabold text-blue-400">
      7 APRIL STORE
    </h1>

    <h2 className="mt-4 text-2xl md:text-4xl font-bold">
      Top Up & Marketplace Free Fire
    </h2>

    <p className="mt-6 max-w-2xl mx-auto text-gray-400 text-base md:text-lg">
      Top Up Diamond, Jual Beli Akun, Rekber, Rental Akun Sultan,
      dan ID Cantik Free Fire dengan proses cepat, aman, dan terpercaya.
    </p>

    <div className="mt-10 flex flex-col md:flex-row justify-center gap-4">

      <a
        href="/topup"
        className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl font-bold transition"
      >
        💎 Top Up Sekarang
      </a>

      <a
        href="/akun"
        className="border border-blue-500 hover:bg-blue-500/20 px-8 py-4 rounded-2xl font-bold transition"
      >
        👑 Lihat Akun
      </a>

    </div>

  </div>

</section>

{/* Statistik */}
<section className="px-8 py-16">
  <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">

    <div className="bg-[#121B33] p-6 rounded-2xl text-center">
      <h3 className="text-3xl font-bold text-blue-400">
        337K+
      </h3>
      <p className="text-gray-400 mt-2">
        Followers TikTok
      </p>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl text-center">
      <h3 className="text-3xl font-bold text-blue-400">
        10K+
      </h3>
      <p className="text-gray-400 mt-2">
        Transaksi
      </p>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl text-center">
      <h3 className="text-3xl font-bold text-blue-400">
        24/7
      </h3>
      <p className="text-gray-400 mt-2">
        Fast Response
      </p>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl text-center">
      <h3 className="text-3xl font-bold text-blue-400">
        100%
      </h3>
      <p className="text-gray-400 mt-2">
        Rekber Aman
      </p>
    </div>

  </div>
</section>

{/* Layanan Kami */}
<section className="px-8 py-16">
  <h2 className="text-3xl font-bold text-center mb-10">
    Layanan Kami
  </h2>

  <div className="grid md:grid-cols-3 gap-6">

    <Link
      href="/topup"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">💎 Top Up FF</h3>
      <p className="text-gray-400">
        Top up diamond Free Fire cepat, aman, dan harga bersahabat.
      </p>
    </Link>

    <Link
      href="/akun"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">👑 Jual Akun FF</h3>
      <p className="text-gray-400">
        Berbagai akun Free Fire mulai dari sultan hingga akun murah.
      </p>
    </Link>

    <Link
      href="/rekber"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">🔒 Jasa Rekber</h3>
      <p className="text-gray-400">
        Transaksi akun lebih aman dengan layanan rekber terpercaya.
      </p>
    </Link>

    <Link
      href="/rental"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">🎮 Rental Akun FF</h3>
      <p className="text-gray-400">
        Rental akun sultan Free Fire dengan sistem yang aman.
      </p>
    </Link>

    <Link
      href="/id-cantik"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">✨ ID Cantik FF</h3>
      <p className="text-gray-400">
        Jual berbagai ID Free Fire unik dan langka.
      </p>
    </Link>

  </div>
</section>

{/* Testimoni */}
<section className="px-8 py-16 bg-[#0A0F1F]">
  <h2 className="text-3xl font-bold text-center mb-10">
    ⭐ Testimoni Pelanggan
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900">
      <h3 className="font-bold text-yellow-400 mb-3">
        ⭐⭐⭐⭐⭐
      </h3>

      <p className="text-gray-300">
        "Top up cepat banget, cuma 2 menit langsung masuk. Recommended!"
      </p>

      <p className="text-blue-400 mt-4 font-bold">
        — Rizky, Pontianak
      </p>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900">
      <h3 className="font-bold text-yellow-400 mb-3">
        ⭐⭐⭐⭐⭐
      </h3>

      <p className="text-gray-300">
        "Jual beli akun aman pakai rekber, admin responsif dan terpercaya."
      </p>

      <p className="text-blue-400 mt-4 font-bold">
        — Andi, Sambas
      </p>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900">
      <h3 className="font-bold text-yellow-400 mb-3">
        ⭐⭐⭐⭐⭐
      </h3>

      <p className="text-gray-300">
        "Rental akun sultan lancar, skin lengkap dan harga bersahabat."
      </p>

      <p className="text-blue-400 mt-4 font-bold">
        — Fajar, Singkawang
      </p>
    </div>

  </div>
</section>

{/* Diamond Free Fire */}
<section className="px-8 py-16 bg-[#0D1428]">
  <h2 className="text-3xl font-bold text-center mb-10">
    💎 Diamond Free Fire
  </h2>

  <div className="grid md:grid-cols-3 gap-6">

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
      <h3 className="text-2xl font-bold">70 Diamond</h3>
      <p className="text-blue-400 text-xl mt-3">Rp12.000</p>

      <a
        href="https://wa.me/6285960237306?text=Halo%20saya%20ingin%20top%20up%2070%20Diamond"
        className="block mt-5 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold"
      >
        Beli Sekarang
      </a>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
      <h3 className="text-2xl font-bold">140 Diamond</h3>
      <p className="text-blue-400 text-xl mt-3">Rp23.000</p>

      <a
        href="https://wa.me/6285960237306?text=Halo%20saya%20ingin%20top%20up%20140%20Diamond"
        className="block mt-5 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold"
      >
        Beli Sekarang
      </a>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
      <h3 className="text-2xl font-bold">355 Diamond</h3>
      <p className="text-blue-400 text-xl mt-3">Rp56.000</p>

      <a
        href="https://wa.me/6285960237306?text=Halo%20saya%20ingin%20top%20up%20355%20Diamond"
        className="block mt-5 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold"
      >
        Beli Sekarang
      </a>
    </div>

  </div>
</section>
{/* Footer */}
<footer className="bg-black border-t border-blue-900 px-8 py-10 mt-10">
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">

    {/* Brand */}
    <div>
      <h2 className="text-2xl font-bold text-blue-400">
        7 APRIL STORE
      </h2>

      <p className="text-gray-400 mt-3">
        Top Up, Jual Beli Akun, Rekber, Rental, dan ID Cantik
        Free Fire terpercaya.
      </p>
    </div>

    {/* Kontak */}
    <div>
      <h3 className="font-bold text-lg mb-3">
        Kontak Kami
      </h3>

      <p>📞 WhatsApp: 0859-6023-7306</p>
      <p>📷 Instagram: @falintino07</p>
      <p>💳 QRIS: Tersedia</p>
    </div>

    {/* Layanan */}
    <div>
      <h3 className="font-bold text-lg mb-3">
        Layanan
      </h3>

      <p>💎 Top Up Free Fire</p>
      <p>👑 Jual Akun FF</p>
      <p>🔒 Jasa Rekber</p>
      <p>🎮 Rental Akun FF</p>
      <p>✨ ID Cantik FF</p>
    </div>

  </div>

  <div className="text-center text-gray-500 mt-10 border-t border-gray-800 pt-5">
    © 2026 7 APRIL STORE. All Rights Reserved.
  </div>
</footer>

{/* Floating WhatsApp */}
<a
  href="https://wa.me/6285960237306"
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl z-50 transition hover:scale-110"
>
  <img
  src="https://cdn-icons-png.flaticon.com/512/220/220236.png"
  alt="WhatsApp"
  className="w-9 h-9"
/>
</a>

    </main>
  );
}