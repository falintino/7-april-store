"use client";

import { useState } from "react";
import { akunList } from "../../data/akun";
import Image from "next/image";
import { notFound } from "next/navigation";

export default function DetailAkun({
  params,
}: {
  params: { slug: string };
}) {

  const akun = akunList.find(
    (item) => item.slug === params.slug
  );

  if (!akun) {
    notFound();
  }

  const [selectedImage, setSelectedImage] = useState(
    akun.images[0]
  );

  return (
    <main className="min-h-screen bg-[#0A0F1F] text-white p-8">

      <div className="grid lg:grid-cols-2 gap-10">

        {/* Gallery */}
        <div>

          <Image
            src={selectedImage}
            width={700}
            height={500}
            alt={akun.nama}
            className="rounded-2xl w-full"
          />

          <div className="grid grid-cols-5 gap-3 mt-4">

            {akun.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(img)}
              >
                <Image
                  src={img}
                  width={120}
                  height={80}
                  alt=""
                  className="rounded-xl"
                />
              </button>
            ))}

          </div>

        </div>

        {/* Detail */}
        <div>

          <h1 className="text-4xl font-bold">
            {akun.nama}
          </h1>

          <p className="text-3xl text-blue-400 mt-4">
            {akun.harga}
          </p>

          <div className="mt-8 space-y-3">

            <p>🎒 Bundle: {akun.bundle}</p>
            <p>🔫 Evo Gun: {akun.evo}</p>
            <p>😂 Emote: {akun.emote}</p>
            <p>⭐ Level: {akun.level}</p>
            <p>🔐 Login: {akun.login}</p>

          </div>

          <a
            href={`https://wa.me/6285960237306?text=Halo kak, saya ingin membeli ${akun.nama}`}
            className="block bg-green-600 text-center py-4 rounded-2xl mt-10 text-xl font-bold"
          >
            BELI VIA WHATSAPP
          </a>

        </div>

      </div>

    </main>
  );
}