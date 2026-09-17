"use client";

import GameCard from "./GameCard";

const games = [
  { title: "Free Fire", image: "/images/games/freefire.jpg", href: "/topup/free-fire" },
];

export default function GamesGrid() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-8 text-center sm:mb-12">
          <span className="rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-400">
            Produk Tersedia
          </span>

          <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
            Top Up Free Fire
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Pilih nominal Diamond Free Fire sesuai kebutuhanmu. Pesanan diproses
            setelah pembayaran berhasil dikonfirmasi.
          </p>
        </div>

        <div className="mx-auto grid max-w-sm grid-cols-1 gap-4">
          {games.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
}
