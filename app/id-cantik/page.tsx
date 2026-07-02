export default function IdCantikPage() {
  return (
    <main className="min-h-screen bg-[#0A0F1F] text-white p-8">
      <h1 className="text-4xl font-bold text-center text-blue-400 mb-8">
        ✨ ID Cantik Free Fire
      </h1>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">ID 7777777</h2>
          <p className="text-blue-400 text-xl mt-3">Rp300.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20tertarik%20dengan%20ID%207777777"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Beli Sekarang
          </a>
        </div>

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">ID 12345678</h2>
          <p className="text-blue-400 text-xl mt-3">Rp150.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20tertarik%20dengan%20ID%2012345678"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Beli Sekarang
          </a>
        </div>

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">ID 99999999</h2>
          <p className="text-blue-400 text-xl mt-3">Rp500.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20tertarik%20dengan%20ID%2099999999"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Beli Sekarang
          </a>
        </div>

      </div>
    </main>
  );
}