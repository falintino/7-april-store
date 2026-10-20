"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const banners = [
  {
    src: "/images/banners/7-april-store-promo.webp",
    alt: "Promo Top Up Free Fire 7 April Store, harga hemat dan proses cepat",
    href: "/topup/free-fire",
    position: "object-[34%_center] sm:object-center",
  },
  {
    src: "/images/banners/7-april-store-safe.webp",
    alt: "Transaksi aman dan transparan di 7 April Store",
    href: "/profil",
    position: "object-[38%_center] sm:object-center",
  },
  {
    src: "/images/banners/7-april-store-partnership.webp",
    alt: "Informasi kemitraan 7 April Store",
    href: "/profil",
    position: "object-center",
  },
  {
    src: "/images/banners/banner-1-promo-diskon.jpg",
    alt: "Promo diskon top up Free Fire 7 April Store",
    href: "/topup/free-fire",
    position: "object-center",
  },
  {
    src: "/images/banners/banner-2-qris-otomatis.jpg",
    alt: "Top up Free Fire bayar menggunakan QRIS",
    href: "/topup/free-fire",
    position: "object-center",
  },
  {
    src: "/images/banners/banner-3-produk-layanan.jpg",
    alt: "Produk dan layanan Free Fire dari 7 April Store",
    href: "/",
    position: "object-center",
  },
];

export default function PromoBannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [paused]);

  return (
    <section
      className="bg-[#030712] px-5 pb-3 pt-8 sm:px-8"
      aria-label="Promo 7 April Store"
    >
      <div
        className="mx-auto max-w-7xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="relative aspect-[2/1] overflow-hidden rounded-2xl border border-blue-400/20 bg-[#041126] shadow-[0_20px_70px_rgba(0,82,255,0.18)] sm:aspect-[5/1] sm:rounded-3xl">
          {banners.map((banner, index) => {
            const active = index === activeIndex;

            return (
              <Link
                key={banner.src}
                href={banner.href}
                aria-label={banner.alt}
                aria-hidden={!active}
                tabIndex={active ? 0 : -1}
                className={`absolute inset-0 transition-all duration-700 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 ${
                  active
                    ? "translate-x-0 opacity-100"
                    : index < activeIndex
                      ? "-translate-x-full opacity-0"
                      : "translate-x-full opacity-0"
                }`}
              >
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 640px) 100vw, 1280px"
                  className={`object-cover ${banner.position}`}
                />
                <span className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
              </Link>
            );
          })}

          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4">
            {banners.map((banner, index) => (
              <span
                key={banner.src}
                aria-hidden="true"
                className={`h-2 rounded-full shadow-sm transition-all ${
                  index === activeIndex ? "w-7 bg-white" : "w-2 bg-white/45"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
