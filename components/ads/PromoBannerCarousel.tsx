"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const banners = [
  {
    src: "/images/banners/7A_Store_banner_text_kecil_2048x364%20(1).png",
    alt: "Banner 7A Store — top up Free Fire murah dan otomatis",
    href: "/topup/free-fire",
  },
  {
    src: "/images/banners/banner-2-qris-otomatis.jpg",
    alt: "Banner pembayaran QRIS otomatis 7 April Store",
    href: "/profil",
  },
  {
    src: "/images/banners/banner-3-produk-layanan.jpg",
    alt: "Banner produk dan layanan 7 April Store",
    href: "/profil",
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
      className="bg-[#020617] px-3 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-7"
      aria-label="Promo 7 April Store"
    >
      <div
        className="mx-auto max-w-7xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="relative aspect-[5.7/1] w-full overflow-hidden rounded-lg border border-cyan-400/25 bg-[#020617] shadow-[0_18px_60px_rgba(0,82,255,0.2)] sm:rounded-2xl">
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
                  className="object-contain object-center"
                />
                <span className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
              </Link>
            );
          })}

          <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-3 sm:gap-2">
            {banners.map((banner, index) => (
              <span
                key={banner.src}
                aria-hidden="true"
                className={`h-1.5 rounded-full shadow-sm transition-all sm:h-2 ${
                  index === activeIndex ? "w-5 bg-white sm:w-7" : "w-1.5 bg-white/45"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
