import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0F1F] text-white">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-blue-900">
        <div className="flex items-center gap-3">
          <img
  src="/logo/logo7a.png"
  alt="7A Logo"
  className="w-14 h-14 object-contain"
/>

          <div>
            <h1 className="font-bold text-xl">7 APRIL STORE</h1>
            <p className="text-sm text-gray-400">
              Free Fire Marketplace
            </p>
          </div>
        </div>

        <div className="hidden md:flex gap-6">
  <Link href="/" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Beranda
  </Link>

  <Link href="/topup" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Top Up FF
  </Link>

  <Link href="/akun" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Jual Akun FF
  </Link>

  <Link href="/rekber" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Rekber FF
  </Link>

  <Link href="/rental" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    Rental Akun
  </Link>

  <Link href="/id-cantik" className="hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30">
    ID Cantik FF
  </Link>

</div>

      </nav>

      {/* Hero Section */}
      <section className="text-center py-24 px-6">
        <h2 className="text-6xl font-extrabold text-blue-400 drop-shadow-lg">
  7 APRIL STORE
</h2>

<h3 className="text-4xl font-bold mt-4">
  Top Up & Marketplace Free Fire
</h3>

        <h3 className="text-5xl font-bold mt-2">
          TERMURAH & TERPERCAYA
        </h3>

        <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-lg">
  Tempat Top Up Diamond, Jual Beli Akun, Rekber,
  Rental Akun Sultan, dan ID Cantik Free Fire
  dengan proses cepat, aman, dan terpercaya.
</p>

        <div className="mt-8 flex justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold">
            Top Up Sekarang
          </button>

          <a
            href="https://wa.me/6285960237306"
            target="_blank"
            className="border border-blue-500 px-6 py-3 rounded-xl font-bold hover:bg-blue-900"
          >
            Hubungi CS
          </a>
        </div>
      </section>
{/* Layanan Kami */}
<section className="px-8 py-16">
  <h2 className="text-3xl font-bold text-center mb-10">
    Layanan Kami
  </h2>

  <div className="grid md:grid-cols-3 gap-6">

    <Link
      href="/topup"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">💎 Top Up FF</h3>
      <p className="text-gray-400">
        Top up diamond Free Fire cepat, aman, dan harga bersahabat.
      </p>
    </Link>

    <Link
      href="/akun"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">👑 Jual Akun FF</h3>
      <p className="text-gray-400">
        Berbagai akun Free Fire mulai dari sultan hingga akun murah.
      </p>
    </Link>

    <Link
      href="/rekber"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">🔒 Jasa Rekber</h3>
      <p className="text-gray-400">
        Transaksi akun lebih aman dengan layanan rekber terpercaya.
      </p>
    </Link>

    <Link
      href="/rental"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">🎮 Rental Akun FF</h3>
      <p className="text-gray-400">
        Rental akun sultan Free Fire dengan sistem yang aman.
      </p>
    </Link>

    <Link
      href="/id-cantik"
      className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 hover:border-blue-500 hover:scale-105 transition block"
    >
      <h3 className="text-2xl mb-3">✨ ID Cantik FF</h3>
      <p className="text-gray-400">
        Jual berbagai ID Free Fire unik dan langka.
      </p>
    </Link>

  </div>
</section>
{/* Diamond Free Fire */}
<section className="px-8 py-16 bg-[#0D1428]">
  <h2 className="text-3xl font-bold text-center mb-10">
    💎 Diamond Free Fire
  </h2>

  <div className="grid md:grid-cols-3 gap-6">

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
      <h3 className="text-2xl font-bold">70 Diamond</h3>
      <p className="text-blue-400 text-xl mt-3">Rp12.000</p>

      <a
        href="https://wa.me/6285960237306?text=Halo%20saya%20ingin%20top%20up%2070%20Diamond"
        className="block mt-5 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold"
      >
        Beli Sekarang
      </a>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
      <h3 className="text-2xl font-bold">140 Diamond</h3>
      <p className="text-blue-400 text-xl mt-3">Rp23.000</p>

      <a
        href="https://wa.me/6285960237306?text=Halo%20saya%20ingin%20top%20up%20140%20Diamond"
        className="block mt-5 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold"
      >
        Beli Sekarang
      </a>
    </div>

    <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
      <h3 className="text-2xl font-bold">355 Diamond</h3>
      <p className="text-blue-400 text-xl mt-3">Rp56.000</p>

      <a
        href="https://wa.me/6285960237306?text=Halo%20saya%20ingin%20top%20up%20355%20Diamond"
        className="block mt-5 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold"
      >
        Beli Sekarang
      </a>
    </div>

  </div>
</section>
{/* Footer */}
<footer className="bg-black border-t border-blue-900 px-8 py-10 mt-10">
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">

    {/* Brand */}
    <div>
      <h2 className="text-2xl font-bold text-blue-400">
        7 APRIL STORE
      </h2>

      <p className="text-gray-400 mt-3">
        Top Up, Jual Beli Akun, Rekber, Rental, dan ID Cantik
        Free Fire terpercaya.
      </p>
    </div>

    {/* Kontak */}
    <div>
      <h3 className="font-bold text-lg mb-3">
        Kontak Kami
      </h3>

      <p>📞 WhatsApp: 0859-6023-7306</p>
      <p>📷 Instagram: @falintino07</p>
      <p>💳 QRIS: Tersedia</p>
    </div>

    {/* Layanan */}
    <div>
      <h3 className="font-bold text-lg mb-3">
        Layanan
      </h3>

      <p>💎 Top Up Free Fire</p>
      <p>👑 Jual Akun FF</p>
      <p>🔒 Jasa Rekber</p>
      <p>🎮 Rental Akun FF</p>
      <p>✨ ID Cantik FF</p>
    </div>

  </div>

  <div className="text-center text-gray-500 mt-10 border-t border-gray-800 pt-5">
    © 2026 7 APRIL STORE. All Rights Reserved.
  </div>
</footer>
    </main>
  );
}