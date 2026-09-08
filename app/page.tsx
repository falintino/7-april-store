import Hero from "@/components/hero/Hero";
import QuickMenu from "@/components/quick-menu/QuickMenu";
import ServicesGrid from "@/components/services/ServicesGrid";
import GamesGrid from "@/components/games/GamesGrid";

export default function Home() {
  return (
    <main className="bg-[#030712]">
      <Hero />
      <QuickMenu />
      <ServicesGrid />
      <GamesGrid />
    </main>
  );
}