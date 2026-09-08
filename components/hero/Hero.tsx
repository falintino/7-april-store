"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  Zap,
  Star,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Blur */}
      <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[150px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-14 px-6 py-24 lg:flex-row lg:justify-between">

        {/* LEFT */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .7 }}
          className="max-w-2xl"
        >

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">

            <Star className="h-4 w-4 fill-current"/>

            Trusted Gaming Marketplace

          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight text-white md:text-7xl">

            7 APRIL
            <br />

            <span className="text-blue-500">
              STORE
            </span>

          </h1>

          <p className="mt-8 text-lg leading-8 text-gray-400">

            Top Up Game, Jual Akun, Rekber dan Rental
            dengan proses super cepat, aman,
            dan harga terbaik.

          </p>

          <div className="mt-10 flex flex-wrap gap-4">

            <button className="group flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500">

              ⚡ Top Up Sekarang

              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1"/>

            </button>

            <button className="rounded-xl border border-gray-700 px-6 py-4 font-semibold text-white transition hover:border-blue-500 hover:bg-blue-500/10">

              📦 Semua Layanan

            </button>

          </div>

          <div className="mt-12 flex flex-wrap gap-6 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500"/>
              24 Jam
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500"/>
              Aman
            </div>

            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500"/>
              QRIS
            </div>

            <div className="flex items-center gap-2">
              ⭐ 10.000+ Transaksi
            </div>

          </div>

        </motion.div>

        {/* RIGHT */}

        <motion.div
          initial={{ opacity:0, scale:.9 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ duration:.8 }}
          className="relative"
        >

          <div className="relative flex h-[430px] w-[430px] items-center justify-center rounded-[40px] border border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 shadow-[0_0_80px_rgba(37,99,235,.2)]">

            <div className="absolute h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"/>

            <div className="text-center">

              <div className="text-8xl">
                🎮
              </div>

              <h3 className="mt-5 text-2xl font-bold text-white">
                Gaming Marketplace
              </h3>

              <p className="mt-2 text-gray-400">
                Cepat • Aman • Terpercaya
              </p>

            </div>

          </div>

        </motion.div>

      </div>

    </section>
  );
}