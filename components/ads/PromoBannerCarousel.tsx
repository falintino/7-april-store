import Image from "next/image";
import Link from "next/link";

export default function PromoBannerCarousel() {
  return (
    <section
      className="bg-[#030712] px-5 pb-3 pt-8 sm:px-8"
      aria-label="Promo 7 April Store"
    >
      <div className="mx-auto max-w-7xl">
        <Link
          href="/topup/free-fire"
          aria-label="Top up Free Fire mulai Rp750"
          className="group relative block aspect-[2/1] overflow-hidden rounded-2xl border border-blue-400/20 bg-[#041126] shadow-[0_20px_70px_rgba(0,82,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#030712] sm:aspect-[5/1] sm:rounded-3xl"
        >
          <Image
            src="/images/banners/7-april-store-promo.webp"
            alt="Promo Top Up Free Fire 7 April Store, harga hemat dan proses cepat mulai Rp750"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 1280px"
            className="object-cover object-[34%_center] transition duration-500 group-hover:scale-[1.015] sm:object-center"
          />
          <span className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
        </Link>
      </div>
    </section>
  );
}
