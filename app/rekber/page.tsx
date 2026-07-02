export default function RekberPage() {
  return (
    <main className="min-h-screen bg-[#0A0F1F] text-white p-8">
      <h1 className="text-4xl font-bold text-center text-blue-400 mb-8">
        🔒 Jasa Rekber Free Fire
      </h1>

      <div className="max-w-3xl mx-auto bg-[#121B33] rounded-2xl p-8 border border-blue-900">
        <h2 className="text-2xl font-bold mb-6">
          Biaya Rekber
        </h2>

        <div className="space-y-4 text-lg">
          <p>💰 Transaksi di bawah Rp100.000 → Fee Rp5.000</p>
          <p>💰 Rp100.000 - Rp500.000 → Fee Rp10.000</p>
          <p>💰 Di atas Rp500.000 → Fee 2%</p>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">
            Keuntungan Menggunakan Rekber
          </h3>

          <ul className="space-y-2 text-gray-300">
            <li>✅ Aman 100%</li>
            <li>✅ Proses cepat</li>
            <li>✅ Bukti transaksi lengkap</li>
            <li>✅ Admin terpercaya</li>
          </ul>
        </div>

        <a
          href="https://wa.me/6285960237306"
          target="_blank"
          className="block mt-10 bg-blue-600 hover:bg-blue-700 py-4 rounded-xl text-center font-bold"
        >
          Gunakan Jasa Rekber
        </a>
      </div>
    </main>
  );
}