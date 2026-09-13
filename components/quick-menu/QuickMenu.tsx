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
  { title: "Top Up", href: "/topup", icon: Diamond },
  { title: "Rekber", href: "/rekber", icon: ShieldCheck },
  { title: "Jual Akun", href: "/akun", icon: ShoppingCart },
  { title: "Stok Akun", href: "/akun", icon: Boxes },
  { title: "Rental", href: "/rental", icon: Gamepad2 },
  { title: "WhatsApp", href: "/contact", icon: MessageCircle },
];

export default function QuickMenu() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">
              Quick Access
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Pilih Layanan
            </h2>
          </div>

          <p className="shrink-0 pb-1 text-xs font-medium text-slate-500 lg:hidden">
            Geser →
          </p>
        </div>

        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 lg:grid lg:grid-cols-6 lg:gap-5 lg:overflow-visible lg:pb-0">
          {menus.map((menu) => (
            <QuickMenuCard key={menu.title} {...menu} />
          ))}
        </div>
      </div>
    </section>
  );
}
