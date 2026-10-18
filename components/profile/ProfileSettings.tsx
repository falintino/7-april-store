"use client";

import { useEffect, useState } from "react";

type Props = { whatsapp: string };

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function displayWhatsapp(value: string) {
  return value.startsWith("62") ? `0${value.slice(2)}` : value;
}

export default function ProfileSettings({ whatsapp: initialWhatsapp }: Props) {
  const [gameId, setGameId] = useState("");
  const [autoFill, setAutoFill] = useState(true);
  const [whatsapp, setWhatsapp] = useState(displayWhatsapp(initialWhatsapp));
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [gameIdMessage, setGameIdMessage] = useState("");

  useEffect(() => {
    try {
      setGameId(window.localStorage.getItem("7as_ff_profile_uid") ?? "");
      setAutoFill(window.localStorage.getItem("7as_ff_profile_uid_autofill") !== "false");
    } catch {}
  }, []);

  function saveGameId() {
    const clean = gameId.replace(/\D/g, "").slice(0, 20);
    if (clean && clean.length < 6) {
      setGameIdMessage("UID harus minimal 6 angka, atau kosongkan jika tidak ingin menyimpan.");
      return;
    }
    try {
      if (clean) window.localStorage.setItem("7as_ff_profile_uid", clean);
      else window.localStorage.removeItem("7as_ff_profile_uid");
      window.localStorage.setItem("7as_ff_profile_uid_autofill", String(autoFill));
      setGameId(clean);
      setGameIdMessage(clean ? "ID Free Fire berhasil disimpan di perangkat ini." : "ID Free Fire tersimpan sudah dihapus.");
    } catch {
      setGameIdMessage("Browser tidak mengizinkan penyimpanan. Coba periksa pengaturan browser.");
    }
  }

  async function saveWhatsapp() {
    const normalized = normalizeWhatsapp(whatsapp);
    if (!/^62\d{8,13}$/.test(normalized)) {
      setWhatsappMessage("Masukkan nomor WhatsApp aktif yang valid.");
      return;
    }
    setSavingWhatsapp(true);
    setWhatsappMessage("");
    try {
      const response = await fetch("/api/profile/whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: normalized }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Gagal memperbarui nomor WhatsApp.");
      setWhatsapp(displayWhatsapp(data.whatsapp));
      setWhatsappMessage("Nomor WhatsApp berhasil diperbarui.");
    } catch (error) {
      setWhatsappMessage(error instanceof Error ? error.message : "Gagal memperbarui nomor WhatsApp.");
    } finally {
      setSavingWhatsapp(false);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <section className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
        <h3 className="font-bold text-white">ID Free Fire (Opsional)</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Simpan UID di perangkat ini agar kolom UID terisi otomatis saat top up. Boleh dikosongkan dan bisa diubah kapan saja.
        </p>
        <input
          value={gameId}
          onChange={(event) => { setGameId(event.target.value.replace(/\D/g, "").slice(0, 20)); setGameIdMessage(""); }}
          inputMode="numeric"
          placeholder="Masukkan ID Free Fire (opsional)"
          className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#060b16] px-3 text-sm text-white outline-none focus:border-blue-500"
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={autoFill} onChange={(event) => setAutoFill(event.target.checked)} className="accent-blue-500" />
          Aktifkan isi otomatis saat top up
        </label>
        <button type="button" onClick={saveGameId} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">
          Simpan ID
        </button>
        {gameIdMessage && <p className="mt-2 text-xs text-blue-300">{gameIdMessage}</p>}
      </section>

      <section className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
        <h3 className="font-bold text-white">Ubah Nomor WhatsApp</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Jika nomor lama sudah tidak aktif atau kamu ganti nomor, masukkan nomor WhatsApp baru. Nomor harus valid dan belum dipakai akun lain.
        </p>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={whatsapp}
          onChange={(event) => { setWhatsapp(event.target.value.replace(/[^\d+\s()-]/g, "")); setWhatsappMessage(""); }}
          placeholder="Contoh: 081234567890"
          className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#060b16] px-3 text-sm text-white outline-none focus:border-blue-500"
        />
        <button type="button" onClick={saveWhatsapp} disabled={savingWhatsapp} className="mt-3 rounded-xl border border-blue-500/30 px-4 py-2 text-sm font-bold text-blue-300 hover:bg-blue-500/10 disabled:opacity-50">
          {savingWhatsapp ? "Menyimpan..." : "Perbarui WhatsApp"}
        </button>
        {whatsappMessage && <p className="mt-2 text-xs text-blue-300">{whatsappMessage}</p>}
      </section>
    </div>
  );
}
