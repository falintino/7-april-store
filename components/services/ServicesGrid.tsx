"use client";

import {
  Diamond,
  ShieldCheck,
  ShoppingCart,
  Boxes,
  Gamepad2,
  Phone,
} from "lucide-react";

import ServiceCard from "./ServiceCard";

const services = [
  {
    title: "Top Up Game",
    description:
      "Diamond Free Fire, MLBB, PUBG Mobile, Honor of Kings, dan game lainnya.",
    href: "/topup",
    icon: Diamond,
    featured: true,
  },
  {
    title: "Rekber",
    description:
      "Transaksi akun game lebih aman dengan layanan rekening bersama.",
    href: "/rekber",
    icon: ShieldCheck,
  },
  {
    title: "Jual Akun",
    description:
      "Jual akun game dengan proses cepat dan aman.",
    href: "/jual-akun",
    icon: ShoppingCart,
  },
  {
    title: "Stok Akun",
    description:
      "Lihat koleksi akun siap pakai dengan update stok terbaru.",
    href: "/stok-akun",
    icon: Boxes,
  },
  {
    title: "Rental Akun",
    description:
      "Sewa akun premium untuk bermain tanpa harus membeli.",
    href: "/rental",
    icon: Gamepad2,
  },
  {
    title: "Nomor Resmi",
    description:
      "Hubungi admin resmi 7 April Store melalui WhatsApp.",
    href: "/contact",
    icon: Phone,
  },
];

export default function ServicesGrid() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-14 text-center">
          <span className="rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-400">
            Layanan Utama
          </span>

          <h2 className="mt-5 text-4xl font-black text-white">
            Semua Kebutuhan Gaming Dalam Satu Tempat
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Kami menyediakan berbagai layanan untuk kebutuhan gamer,
            mulai dari top up, jual akun, rekber, hingga rental akun.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.title}
              {...service}
            />
          ))}
        </div>

      </div>
    </section>
  );
}