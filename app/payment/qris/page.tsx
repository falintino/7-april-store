import Link from "next/link";

type PageProps = {
  searchParams: Promise<{
    invoice?: string;
    qr?: string;
    amount?: string;
    expires?: string;
  }>;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function QrisPaymentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const invoice = params.invoice?.trim() ?? "";
  const qrUrl = params.qr ?? "";
  const amount = Number(params.amount);
  const expires = Number(params.expires);
  const validQrUrl =
    qrUrl.startsWith("https://api.midtrans.com/") ||
    qrUrl.startsWith("https://api.sandbox.midtrans.com/");

  if (
    !invoice ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !Number.isFinite(expires) ||
    !validQrUrl
  ) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-bold">Data QRIS tidak valid</h1>
          <p className="mt-3 text-sm text-slate-300">
            Silakan kembali ke halaman top up dan buat pembayaran QRIS yang baru.
          </p>
          <Link className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold" href="/topup/free-fire">
            Kembali ke Top Up
          </Link>
        </div>
      </main>
    );
  }

  const expired = Date.now() >= expires;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/topup/free-fire" className="text-sm font-medium text-sky-400 hover:text-sky-300">
          ← 7 April Store
        </Link>

        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Pembayaran QRIS</p>
                <h1 className="mt-1 text-2xl font-bold">Scan untuk membayar</h1>
              </div>
              <span className="rounded-full border border-emerald-700/70 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-300">
                Midtrans
              </span>
            </div>

            <div className="mx-auto mt-6 flex min-h-72 max-w-sm items-center justify-center rounded-2xl bg-white p-4">
              {expired ? (
                <div className="text-center text-slate-900">
                  <p className="font-bold">Waktu pembayaran mungkin sudah habis</p>
                  <p className="mt-2 text-sm">Periksa status pesanan sebelum membuat pembayaran baru.</p>
                </div>
              ) : (
                // The QR image URL is returned by Midtrans for this specific transaction.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="Kode QRIS pembayaran"
                  className="h-auto max-h-80 w-full max-w-80 object-contain"
                />
              )}
            </div>

            <p className="mt-4 text-center text-sm text-slate-400">
              Buka aplikasi bank atau dompet digital, pilih Scan QRIS, lalu scan kode di atas.
            </p>
            <a
              href={qrUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Buka / Unduh QRIS
            </a>
            <Link
              href={`/payment/finish?order_id=${encodeURIComponent(invoice)}`}
              className="mt-3 flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
            >
              Cek Status Pembayaran
            </Link>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <p className="text-sm text-slate-400">Total pembayaran</p>
              <p className="mt-2 text-3xl font-extrabold text-sky-400">{formatRupiah(amount)}</p>
              <div className="my-5 border-t border-slate-800" />
              <p className="text-sm text-slate-400">Nomor invoice</p>
              <p className="mt-1 break-all font-semibold">{invoice}</p>
            </section>

            <section className="rounded-2xl border border-amber-700/50 bg-amber-950/30 p-5">
              <h2 className="font-bold text-amber-300">Penting</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-slate-200">
                <li>Bayar sesuai nominal yang tertera.</li>
                <li>Jangan tutup halaman ini sebelum menyimpan nomor invoice.</li>
                <li>Jika sudah membayar, tekan “Cek Status Pembayaran”.</li>
                <li>Status pembayaran diverifikasi oleh sistem, bukan dari bukti transfer saja.</li>
              </ul>
            </section>

            <Link href="/topup/free-fire" className="block rounded-xl border border-slate-800 px-4 py-3 text-center text-sm text-slate-300 hover:bg-slate-900">
              Kembali ke halaman top up
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
