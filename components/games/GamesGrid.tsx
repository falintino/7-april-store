"use client";

import GameCard from "./GameCard";

const games = [
  {
    title: "Free Fire",
    image: "/images/games/freefire.jpg",
    href: "/topup/free-fire",
  },
  {
    title: "Mobile Legends",
    image: "/images/games/mlbb.jpg",
    href: "/topup/mobile-legends",
  },
  {
    title: "Honor of Kings",
    image: "/images/games/hok.jpg",
    href: "/topup/honor-of-kings",
  },
  {
    title: "PUBG Mobile",
    image: "/images/games/pubgm.jpg",
    href: "/topup/pubg-mobile",
  },
  {
    title: "Valorant",
    image: "/images/games/valorant.jpg",
    href: "/topup/valorant",
  },
  {
    title: "Genshin Impact",
    image: "/images/games/genshin.jpg",
    href: "/topup/genshin-impact",
  },
];

export default function GamesGrid() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <span className="rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-400">
            Game Populer
          </span>

          <h2 className="mt-5 text-4xl font-black text-white">
            Pilih Game Favoritmu
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Top up berbagai game populer dengan proses instan, aman, dan harga
            bersaing.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {games.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
}