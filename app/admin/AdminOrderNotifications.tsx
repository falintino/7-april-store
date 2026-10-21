"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type OrderState = {
  invoice: string;
  paymentStatus: string;
  providerStatus: string;
  updatedAt: string;
  productName: string;
};

type Notice = {
  id: string;
  title: string;
  detail: string;
  kind: "paid" | "success";
};

const STORAGE_KEY = "seven-april-admin-order-notifications-v1";

function playTone(kind: "paid" | "success") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    if (context.state === "suspended") void context.resume();

    // PAID: dua bunyi "ding" yang hangat. SUCCESS: tiga nada naik yang lebih tegas.
    // Volume tetap dibatasi agar jelas tanpa terlalu keras.
    const notes =
      kind === "paid"
        ? [
            { frequency: 880, start: 0, duration: 0.18 },
            { frequency: 1175, start: 0.2, duration: 0.28 },
          ]
        : [
            { frequency: 784, start: 0, duration: 0.16 },
            { frequency: 988, start: 0.18, duration: 0.16 },
            { frequency: 1319, start: 0.36, duration: 0.34 },
          ];

    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = context.currentTime + note.start;
      const endAt = startAt + note.duration;

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(note.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.025);
      gain.gain.setValueAtTime(0.22, Math.max(startAt + 0.03, endAt - 0.08));
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    }

    window.setTimeout(() => void context.close(), 1800);
  } catch {
    // Audio may be blocked until the user interacts with the page.
  }
}

export default function AdminOrderNotifications() {
  const previous = useRef<Map<string, OrderState> | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [lastChecked, setLastChecked] = useState("");

  const pushNotice = useCallback((order: OrderState, kind: "paid" | "success") => {
    const id = `${order.invoice}-${kind}`;
    const notice: Notice = {
      id: `${id}-${Date.now()}`,
      kind,
      title: kind === "paid" ? "Pembayaran berhasil (PAID)" : "Top up berhasil terkirim (SUCCESS)",
      detail: `${order.productName} · Invoice ${order.invoice}`,
    };

    setNotices((current) => [notice, ...current].slice(0, 4));
    if (soundEnabled) playTone(kind);
    window.setTimeout(() => {
      setNotices((current) => current.filter((item) => item.id !== notice.id));
    }, 9000);
  }, [soundEnabled]);

  useEffect(() => {
    let active = true;

    const checkOrders = async () => {
      try {
        const response = await fetch("/api/admin/order-notifications", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) return;

        const result = (await response.json()) as {
          success: boolean;
          orders?: OrderState[];
        };
        if (!active || !result.success || !Array.isArray(result.orders)) return;

        const current = new Map(result.orders.map((order) => [order.invoice, order]));

        if (previous.current) {
          for (const order of result.orders) {
            const old = previous.current.get(order.invoice);
            if (!old) continue;

            if (old.paymentStatus !== "PAID" && order.paymentStatus === "PAID") {
              pushNotice(order, "paid");
            }
            if (old.providerStatus !== "SUCCESS" && order.providerStatus === "SUCCESS") {
              pushNotice(order, "success");
            }
          }
        }

        previous.current = current;
        setLastChecked(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } catch {
        // A temporary network error should not interrupt the admin dashboard.
      }
    };

    void checkOrders();
    const interval = window.setInterval(() => void checkOrders(), 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [pushNotice]);

  return (
    <div className="fixed right-3 top-3 z-[100] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 shadow-xl backdrop-blur">
        <div>
          <p className="text-xs font-bold text-white">Notifikasi pesanan</p>
          <p className="text-[10px] text-slate-400">
            Memantau PAID & SUCCESS{lastChecked ? ` · cek ${lastChecked}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSoundEnabled(true);
            playTone("paid");
          }}
          className={`shrink-0 rounded-lg border px-3 py-2 text-[10px] font-bold ${soundEnabled ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-blue-500/30 bg-blue-500/10 text-blue-300"}`}
        >
          {soundEnabled ? "🔊 Suara aktif" : "🔔 Aktifkan suara"}
        </button>
      </div>

      {notices.map((notice) => (
        <div
          key={notice.id}
          role="status"
          className={`rounded-xl border p-3 shadow-xl backdrop-blur ${notice.kind === "paid" ? "border-sky-400/40 bg-sky-950/95" : "border-green-400/40 bg-green-950/95"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-white">{notice.kind === "paid" ? "💳 " : "✅ "}{notice.title}</p>
              <p className="mt-1 break-words text-[11px] text-slate-200">{notice.detail}</p>
            </div>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))}
              className="text-sm text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
