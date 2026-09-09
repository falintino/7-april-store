"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Megaphone, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const banners = [
  {
    eyebrow: "TOP UP GAME",
    title: "Top Up Free Fire Lebih Mudah",
    description:
      "Pilih nominal favoritmu dan selesaikan pesanan langsung dari website 7 April Store.",
    action: "Top Up Sekarang",
    href: "/topup/free-fire",
    accent: "from-blue-600 via-blue-500 to-cyan-400",
    icon: Sparkles,
  },
  {
    eyebrow: "INFO 7 APRIL STORE",
    title: "Promo dan Update Akan Hadir Di Sini",
    description:
      "Pantau banner ini untuk informasi produk baru, promo terbatas, dan pengumuman penting.",
    action: "Lihat Top Up",
    href: "/topup",
    accent: "from-violet-600 via-fuchsia-500 to-pink-500",
    icon: Megaphone,
  },
  {
    eyebrow: "KERJA SAMA",
    title: "Ruang untuk Promo dan Endorsement",
    description:
      "Informasi kerja sama dan banner partner akan ditampilkan secara transparan di halaman ini.",
    action: "Hubungi Kami",
    href: "https://wa.me/6285960237306",
    accent: "from-emerald-600 via-teal-500 to-cyan-500",
    icon: Megaphone,
  },
];

export default function PromoBannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? banners.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % banners.length);
  };

  return (
    <section className="bg-[#030712] px-5 pb-3 pt-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <div className="relative min-h-[235px] overflow-hidden sm:min-h-[260px]">
            {banners.map((banner, index) => {
              const Icon = banner.icon;
              const isActive = index === activeIndex;

              return (
                <div
                  key={banner.title}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    isActive
                      ? "translate-x-0 opacity-100"
                      : index < activeIndex
                        ? "-translate-x-full opacity-0"
                        : "translate-x-full opacity-0"
                  }`}
                  aria-hidden={!isActive}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${banner.accent}`}
                  />

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.3),transparent_22%),radial-gradient(circle_at_80%_90%,rgba(255,255,255,0.16),transparent_26%)]" />

                  <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[28px] border-white/10" />

                  <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full border-[20px] border-white/10" />

                  <div className="relative flex min-h-[235px] max-w-2xl flex-col justify-center px-7 py-12 sm:min-h-[260px] sm:px-12">
                    <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] text-white backdrop-blur-sm">
                      <Icon size={14} />
                      {banner.eyebrow}
                    </div>

                    <h2 className="max-w-xl text-3xl font-black leading-tight text-white sm:text-4xl">
                      {banner.title}
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
                      {banner.description}
                    </p>

                    <Link
                      href={banner.href}
                      target={
                        banner.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        banner.href.startsWith("http")
                          ? "noreferrer"
                          : undefined
                      }
                      tabIndex={isActive ? 0 : -1}
                      className="mt-6 inline-flex w-fit items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                    >
                      {banner.action}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Banner sebelumnya"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur transition hover:bg-black/35 sm:flex"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            aria-label="Banner selanjutnya"
            onClick={goToNext}
            className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur transition hover:bg-black/35 sm:flex"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((banner, index) => (
              <button
                key={banner.title}
                type="button"
                aria-label={`Tampilkan banner ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-7 bg-white"
                    : "w-2 bg-white/45 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}