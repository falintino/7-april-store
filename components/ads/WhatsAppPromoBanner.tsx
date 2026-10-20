import Link from "next/link";
import { BellRing, Gift, MessageCircle, TicketPercent } from "lucide-react";

const channelUrl =
  "https://www.whatsapp.com/channel/0029VbByfE60VycAQEP6Tz1b";

export default function WhatsAppPromoBanner() {
  return (
    <section
      className="bg-[#030712] px-5 py-5 sm:px-8 sm:py-7"
      aria-label="Kode promo di Saluran WhatsApp 7 April Store"
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-400/30 bg-[#04140e] shadow-[0_18px_60px_rgba(0,255,110,0.12)]">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-green-400/15 blur-3xl" />

          <div className="relative grid items-center gap-7 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:gap-10 lg:p-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-lime-300">
                <TicketPercent size={15} />
                Kode Promo 7 April Store
              </div>

              <h2 className="mt-5 text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Cari Kode Promo
                <span className="mt-1 block bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                  di Saluran WA!
                </span>
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-base sm:leading-7">
                Gabung Saluran WhatsApp 7 April Store untuk cek informasi kode
                promo dan penawaran terbaru. Jangan sampai ketinggalan update!
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white/90">
                  <Gift size={16} className="text-lime-300" />
                  Info Promo
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white/90">
                  <BellRing size={16} className="text-lime-300" />
                  Update Terbaru
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white/90">
                  <MessageCircle size={16} className="text-lime-300" />
                  Saluran WhatsApp
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:w-72">
              <div className="rounded-3xl border border-emerald-300/30 bg-[#061b13]/90 p-5 shadow-[0_0_45px_rgba(34,197,94,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <MessageCircle size={27} />
                  </div>
                  <div>
                    <p className="font-black text-white">7 April Store</p>
                    <p className="text-xs text-emerald-100/60">Saluran WhatsApp</p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-lime-300">
                    🎁 Info kode promo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    Cek saluran untuk mengetahui promo dan kode yang sedang tersedia.
                  </p>
                </div>
                <Link
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-500 px-4 py-3 text-center text-sm font-black text-[#04120a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-200"
                >
                  <MessageCircle size={18} />
                  GABUNG SALURAN WA
                </Link>
                <p className="mt-3 text-center text-[11px] text-emerald-100/50">
                  Buka WhatsApp untuk melihat update
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
