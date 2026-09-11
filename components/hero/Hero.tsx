"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Star,
  Wallet,
  Zap,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[150px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-14 sm:py-16 lg:flex-row lg:justify-between lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            <Star className="h-4 w-4 fill-current" />
            Layanan Produk Digital Game
          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight text-white md:text-7xl">
            7 APRIL
            <br />
            <span className="text-blue-500">STORE</span>
          </h1>

          <p className="mt-8 text-lg leading-8 text-gray-400">
            Top Up Game, Jual Akun, Rekber dan Rental dengan proses super
            cepat, aman, dan harga terbaik.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/topup"
              className="group flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500"
            >
              ⚡ Top Up Sekarang
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="/topup/free-fire"
              className="rounded-xl border border-gray-700 px-6 py-4 font-semibold text-white transition hover:border-blue-500 hover:bg-blue-500/10"
            >
              🎮 Lihat Free Fire
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Layanan Online
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              Bantuan Resmi
            </div>

            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              QRIS
            </div>

            <div className="flex items-center gap-2">Informasi Harga Jelas</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md lg:w-[430px] lg:max-w-none"
        >
          <Link
            href="/topup/free-fire"
            className="group relative block h-[250px] overflow-hidden rounded-[32px] border border-blue-500/30 bg-slate-900 shadow-[0_0_80px_rgba(37,99,235,.2)] sm:h-[320px] lg:h-[430px]"
          >
            <img
              src="/images/games/freefire.jpg"
              alt="Top Up Free Fire di 7 April Store"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/30 to-transparent" />

            <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-white backdrop-blur-md">
              GAME TERPOPULER
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                Top Up Game
              </p>

              <h3 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                Free Fire
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Pilih nominal Diamond favoritmu dan top up sekarang.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white">
                Top Up Sekarang
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}