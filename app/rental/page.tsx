export default function RentalPage() {
  return (
    <main className="min-h-screen bg-[#0A0F1F] text-white p-8">
      <h1 className="text-4xl font-bold text-center text-blue-400 mb-8">
        🎮 Rental Akun Free Fire
      </h1>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">Rental 1 Jam</h2>
          <p className="text-blue-400 text-xl mt-3">Rp5.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20ingin%20rental%20akun%201%20jam"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Rental Sekarang
          </a>
        </div>

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">Rental 12 Jam</h2>
          <p className="text-blue-400 text-xl mt-3">Rp25.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20ingin%20rental%20akun%2012%20jam"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Rental Sekarang
          </a>
        </div>

        <div className="bg-[#121B33] p-6 rounded-2xl border border-blue-900 text-center">
          <h2 className="text-2xl font-bold">Rental 24 Jam</h2>
          <p className="text-blue-400 text-xl mt-3">Rp40.000</p>

          <a
            href="https://wa.me/6285960237306?text=Halo,%20saya%20ingin%20rental%20akun%2024%20jam"
            className="block mt-5 bg-blue-600 py-3 rounded-xl font-bold"
          >
            Rental Sekarang
          </a>
        </div>

      </div>
    </main>
  );
}