import Image from "next/image";
import Link from "next/link";

const banners = [
  {
    src: "/images/banners/banner-1-promo-diskon.jpg",
    alt: "Promo diskon top up Free Fire 7 April Store",
    href: "/topup/free-fire",
  },
  {
    src: "/images/banners/banner-2-qris-otomatis.jpg",
    alt: "Top up Free Fire bayar menggunakan QRIS",
    href: "/topup/free-fire",
  },
  {
    src: "/images/banners/banner-3-produk-layanan.jpg",
    alt: "Produk dan layanan Free Fire dari 7 April Store",
    href: "/",
  },
];

export default function StaticPromoBanners() {
  return (
    <section
      className="bg-[#030712] px-4 pb-7 pt-3 sm:px-8 sm:pb-10"
      aria-label="Promo dan layanan 7 April Store"
    >
      <div className="mx-auto grid max-w-7xl gap-4">
        {banners.map((banner) => (
          <Link
            key={banner.src}
            href={banner.href}
            aria-label={banner.alt}
            className="group block overflow-hidden rounded-2xl border border-blue-400/20 bg-[#041126] shadow-[0_12px_35px_rgba(0,82,255,0.12)] transition hover:border-blue-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:rounded-3xl"
          >
            <div className="relative aspect-[5.7/1] w-full">
              <Image
                src={banner.src}
                alt={banner.alt}
                fill
                sizes="(max-width: 640px) 100vw, 1280px"
                className="object-cover transition duration-300 group-hover:scale-[1.01]"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
