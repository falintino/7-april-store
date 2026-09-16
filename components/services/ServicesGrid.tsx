"use client";

import {
  Diamond,
  ShieldCheck,
  Gamepad2,
  Phone,
} from "lucide-react";

import ServiceCard from "./ServiceCard";

const services = [
  { title: "Top Up Game", description: "Diamond Free Fire, MLBB, PUBG Mobile, Honor of Kings, dan game lainnya.", href: "/topup", icon: Diamond, featured: true },
  { title: "Rekber", description: "Transaksi digital lebih aman dengan layanan rekening bersama.", href: "/rekber", icon: ShieldCheck },
  { title: "Rental", description: "Sewa layanan gaming premium sesuai kebutuhan.", href: "/rental", icon: Gamepad2 },
  { title: "Nomor Resmi", description: "Hubungi admin resmi 7 April Store melalui WhatsApp.", href: "/contact", icon: Phone },
];

export default function ServicesGrid() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-8 text-center sm:mb-14">
          <span className="rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-400">Layanan Utama</span>
          <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">Semua Kebutuhan Gaming Dalam Satu Tempat</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">Kami menyediakan layanan untuk kebutuhan gamer, mulai dari top up, rekber, hingga rental.</p>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-4 lg:gap-5">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
