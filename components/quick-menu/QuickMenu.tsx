"use client";

import {
  Diamond,
  ShieldCheck,
  ShoppingCart,
  Boxes,
  Gamepad2,
  MessageCircle,
} from "lucide-react";

import QuickMenuCard from "./QuickMenuCard";

const menus = [
  {
    title: "Top Up",
    href: "/topup",
    icon: Diamond,
  },
  {
    title: "Rekber",
    href: "/rekber",
    icon: ShieldCheck,
  },
  {
    title: "Jual Akun",
    href: "/jual-akun",
    icon: ShoppingCart,
  },
  {
    title: "Stok Akun",
    href: "/stok-akun",
    icon: Boxes,
  },
  {
    title: "Rental",
    href: "/rental",
    icon: Gamepad2,
  },
  {
    title: "WhatsApp",
    href: "/contact",
    icon: MessageCircle,
  },
];

export default function QuickMenu() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">
            Quick Access
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            Pilih Layanan
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {menus.map((menu) => (
            <QuickMenuCard key={menu.title} {...menu} />
          ))}
        </div>
      </div>
    </section>
  );
}