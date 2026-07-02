export default function TopupPage() {
  return (
    <main className="min-h-screen bg-[#0A0F1F] text-white p-8">
      <h1 className="text-4xl font-bold text-center text-blue-400 mb-8">
        💎 Top Up Free Fire
      </h1>

      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">70 Diamond</h2>
          <p className="text-blue-400 text-xl mt-3">Rp12.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20ingin%20top%20up%2070%20Diamond"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Beli Sekarang
          </a>
        </div>

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">140 Diamond</h2>
          <p className="text-blue-400 text-xl mt-3">Rp23.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20ingin%20top%20up%20140%20Diamond"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Beli Sekarang
          </a>
        </div>

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">355 Diamond</h2>
          <p className="text-blue-400 text-xl mt-3">Rp56.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20ingin%20top%20up%20355%20Diamond"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Beli Sekarang
          </a>
        </div>

      </div>
    </main>
  );
}