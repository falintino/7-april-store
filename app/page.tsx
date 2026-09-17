import {
  ExternalLink,
  Newspaper,
} from "lucide-react";

import GamesGrid from "@/components/games/GamesGrid";
import Hero from "@/components/hero/Hero";
import PromoBannerCarousel from "@/components/ads/PromoBannerCarousel";
import QuickMenu from "@/components/quick-menu/QuickMenu";
import ServicesGrid from "@/components/services/ServicesGrid";
import SiteFooter from "@/components/layout/SiteFooter";

const ownerPress = [
  {
    outlet: "SINDOnews",
    title: "Rahasia Mudah Booyah di Free Fire, Ini 10 Tips dari Falintino FF",
    href: "https://lifestyle.sindonews.com/read/1723313/166/rahasia-mudah-booyah-di-free-fire-ini-10-tips-dari-kreator-konten-falintino-ff-1782814011",
    date: "30 Juni 2026",
  },
  {
    outlet: "Warta Kota",
    title:
      "Kreator Gaming Falintino Ungkap 7 Cara Meningkatkan Skill yang Wajib Dicoba Pemula",
    href: "https://wartakota.tribunnews.com/news/894167/kreator-gaming-falintino-ungkap-7-cara-meningkatkan-skill-yang-wajib-dicoba-pemula",
    date: "1 Juli 2026",
  },
  {
    outlet: "Republika",
    title: "Falintino FF Bongkar Rahasia Tingkatkan Skill Free Fire",
    href: "https://ameera.republika.co.id/berita/thsspn425/kreator-gaming-falintino-ff-bongkar-rahasia-tingkatkan-skill-free-fire",
    date: "7 Juli 2026",
  },
  {
    outlet: "Liputan6",
    title: "Bangganya Falintino Raih Silver Play Button dari YouTube",
    href: "https://www.liputan6.com/showbiz/read/7893513/bangganya-falintino-raih-silver-play-button-dari-youtube-tepis-stigma-main-game-tak-bermanfaat",
    date: "18 Juni 2026",
  },
];

export default function Home() {
  return (
    <main className="bg-[#030712]">
      <PromoBannerCarousel />
      <Hero />
      <QuickMenu />
      <ServicesGrid />
      <GamesGrid />

      <section className="border-t border-slate-800 bg-[#050b18] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
              <Newspaper size={16} />
              Tentang Pengelola 7 April Store
            </div>

            <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
              Profil Pengelola di Media
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              7 April Store dikelola oleh Falintino, kreator gaming Free Fire
              asal Kabupaten Sambas. Berikut beberapa publikasi media yang
              membahas profil dan pengalaman Falintino.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {ownerPress.map((article) => (
              <a
                key={article.href}
                href={article.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-blue-500/40 hover:bg-blue-500/5"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">
                    {article.outlet}
                  </p>

                  <h3 className="mt-3 font-bold leading-6 text-white">
                    {article.title}
                  </h3>

                  <p className="mt-3 text-xs text-slate-500">
                    {article.date} · Publikasi tentang Falintino
                  </p>
                </div>

                <ExternalLink
                  size={19}
                  className="mt-1 shrink-0 text-slate-500 transition group-hover:text-blue-400"
                />
              </a>
            ))}
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-600">
            Pencantuman artikel tidak menunjukkan adanya kerja sama, afiliasi,
            atau dukungan komersial dari media tersebut terhadap 7 April Store.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
