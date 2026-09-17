"use client";

import {
  Diamond,
  Gamepad2,
  Phone,
  ShieldCheck,
} from "lucide-react";

import ServiceCard from "./ServiceCard";

const services = [
  {
    title: "Top Up Game",
    description:
      "Pilih produk dan nominal top up game yang tersedia di 7 April Store.",
    href: "/topup",
    icon: Diamond,
    featured: true,
  },
  {
    title: "Top Up Free Fire",
    description:
      "Beli Diamond Free Fire dengan memilih nominal sesuai kebutuhan.",
    href: "/topup/free-fire",
    icon: Gamepad2,
  },
  {
    title: "Informasi Transaksi",
    description:
      "Pelajari ketentuan pembelian produk digital sebelum membuat pesanan.",
    href: "/syarat-ketentuan",
    icon: ShieldCheck,
  },
  {
    title: "Bantuan Pelanggan",
    description:
      "Hubungi layanan pelanggan resmi 7 April Store apabila membutuhkan bantuan.",
    href: "/contact",
    icon: Phone,
  },
];

export default function ServicesGrid() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-8 text-center sm:mb-14">
          <span className="rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-400">
            Layanan Utama
          </span>

          <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
            Top Up Game di 7 April Store
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Pilih produk, masukkan data akun game, tentukan nominal, lalu
            selesaikan pembayaran melalui metode yang tersedia.
          </p>
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