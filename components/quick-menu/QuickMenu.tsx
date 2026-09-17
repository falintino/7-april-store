"use client";

import {
  Diamond,
  Gamepad2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import QuickMenuCard from "./QuickMenuCard";

const menus = [
  {
    title: "Top Up",
    href: "/topup",
    icon: Diamond,
  },
  {
    title: "Free Fire",
    href: "/topup/free-fire",
    icon: Gamepad2,
  },
  {
    title: "Bantuan",
    href: "/contact",
    icon: MessageCircle,
  },
  {
    title: "Ketentuan",
    href: "/syarat-ketentuan",
    icon: ShieldCheck,
  },
];

export default function QuickMenu() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">
            Akses Cepat
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            Pilih Menu
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-4 lg:gap-5">
          {menus.map((menu) => (
            <QuickMenuCard key={menu.title} {...menu} />
          ))}
        </div>
      </div>
    </section>
  );
}