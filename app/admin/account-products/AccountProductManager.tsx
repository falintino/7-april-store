"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";

type Product = {
  id: string; slug: string; title: string; price: number; discountPrice: number | null;
  information: string; imageUrls: string[]; bundle: number; evoGun: number; emote: number;
  level: number; login: string; availability: string; active: boolean; featured: boolean;
  createdAt: string; updatedAt: string;
};

type FormState = {
  title: string; slug: string; price: string; discountPrice: string; information: string;
  imageUrls: string; bundle: string; evoGun: string; emote: string; level: string;
  login: string; availability: string; active: boolean; featured: boolean;
};

const emptyForm: FormState = {
  title: "", slug: "", price: "", discountPrice: "", information: "", imageUrls: "",
  bundle: "0", evoGun: "0", emote: "0", level: "0", login: "Google",
  availability: "AVAILABLE", active: true, featured: false,
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
}

function statusLabel(value: string) {
  return value === "AVAILABLE" ? "Tersedia" : value === "RESERVED" ? "Dipesan" : "Terjual";
}

export default function AccountProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const previewUrls = useMemo(() => form.imageUrls.split("\n").map((url) => url.trim()).filter(Boolean), [form.imageUrls]);

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage(null);
  }

  function edit(product: Product) {
    setEditingId(product.id);
    setForm({
      title: product.title, slug: product.slug, price: String(product.price),
      discountPrice: product.discountPrice == null ? "" : String(product.discountPrice),
      information: product.information, imageUrls: product.imageUrls.join("\n"),
      bundle: String(product.bundle), evoGun: String(product.evoGun), emote: String(product.emote),
      level: String(product.level), login: product.login, availability: product.availability,
      active: product.active, featured: product.featured,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = {
      ...form,
      price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      bundle: Number(form.bundle), evoGun: Number(form.evoGun), emote: Number(form.emote), level: Number(form.level),
      imageUrls: previewUrls,
    };
    try {
      const response = await fetch(editingId ? `/api/admin/account-products/${editingId}` : "/api/admin/account-products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal menyimpan produk.");
      setProducts((current) => editingId
        ? current.map((item) => item.id === editingId ? data.product : item)
        : [data.product, ...current]);
      setMessage({ type: "success", text: data.message });
      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal menyimpan produk." });
    } finally {
      setSaving(false);
    }
  }

  async function remove(product: Product) {
    if (!window.confirm(`Hapus "${product.title}" secara permanen?`)) return;
    const response = await fetch(`/api/admin/account-products/${product.id}`, { method: "DELETE" });
    const data = await response.json();
    if (response.ok) {
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingId === product.id) reset();
      setMessage({ type: "success", text: data.message });
    } else {
      setMessage({ type: "error", text: data.message || "Gagal menghapus produk." });
    }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500";
  const labelClass = "text-sm font-bold text-slate-300";

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[430px_minmax(0,1fr)]">
      <form onSubmit={submit} className="h-fit rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6 xl:sticky xl:top-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{editingId ? "Edit Produk" : "Tambah Produk"}</h2>
          {editingId && <button type="button" onClick={reset} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Batal edit"><X className="h-5 w-5" /></button>}
        </div>

        {message && <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{message.text}</div>}

        <div className="mt-5 space-y-4">
          <label className={labelClass}>Judul produk<input required value={form.title} onChange={(e) => change("title", e.target.value)} className={inputClass} placeholder="Contoh: Akun Sultan Evo 15" /></label>
          <label className={labelClass}>Slug URL (boleh kosong)<input value={form.slug} onChange={(e) => change("slug", e.target.value)} className={inputClass} placeholder="Otomatis dari judul" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>Harga normal<input required min="0" type="number" value={form.price} onChange={(e) => change("price", e.target.value)} className={inputClass} /></label>
            <label className={labelClass}>Harga diskon<input min="0" type="number" value={form.discountPrice} onChange={(e) => change("discountPrice", e.target.value)} className={inputClass} placeholder="Opsional" /></label>
          </div>
          <label className={labelClass}>Teks informasi<textarea required rows={4} value={form.information} onChange={(e) => change("information", e.target.value)} className={inputClass} placeholder="Jelaskan koleksi, kondisi, dan informasi penting akun." /></label>
          <label className={labelClass}>URL foto — satu per baris<textarea rows={4} value={form.imageUrls} onChange={(e) => change("imageUrls", e.target.value)} className={inputClass} placeholder={"https://.../foto-1.jpg\nhttps://.../foto-2.jpg"} /></label>
          <p className="flex items-center gap-2 text-xs text-slate-500"><ImagePlus className="h-4 w-4" />Maksimal 8 URL gambar HTTPS.</p>
          <div className="grid grid-cols-2 gap-3">
            {(["bundle", "evoGun", "emote", "level"] as const).map((key) => (
              <label key={key} className={labelClass}>{key === "evoGun" ? "Evo Gun" : key[0].toUpperCase() + key.slice(1)}
                <input min="0" type="number" value={form[key]} onChange={(e) => change(key, e.target.value)} className={inputClass} />
              </label>
            ))}
          </div>
          <label className={labelClass}>Metode login<input required value={form.login} onChange={(e) => change("login", e.target.value)} className={inputClass} placeholder="Google, Facebook, VK, dan lainnya" /></label>
          <label className={labelClass}>Ketersediaan<select value={form.availability} onChange={(e) => change("availability", e.target.value)} className={inputClass}><option value="AVAILABLE">Tersedia</option><option value="RESERVED">Dipesan</option><option value="SOLD">Terjual</option></select></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 p-3 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => change("active", e.target.checked)} className="h-4 w-4" />Tampilkan produk</label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 p-3 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => change("featured", e.target.checked)} className="h-4 w-4" />Produk unggulan</label>
          </div>
          <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-black hover:bg-blue-500 disabled:opacity-60">
            {editingId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambahkan Produk"}
          </button>
        </div>
      </form>

      <section>
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-black">Daftar Produk</h2><p className="mt-1 text-sm text-slate-400">{products.length} produk tersimpan</p></div>
        </div>
        {products.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-10 text-center text-slate-400">Belum ada produk. Isi formulir untuk menambahkan produk pertama.</div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {products.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
                <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-blue-800 to-cyan-500">
                  {product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={product.title} className="h-full w-full object-cover" /> : <ImagePlus className="h-12 w-12 text-white/80" />}
                  <span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold ${product.availability === "AVAILABLE" ? "bg-emerald-500" : product.availability === "RESERVED" ? "bg-amber-500" : "bg-slate-600"}`}>{statusLabel(product.availability)}</span>
                  {!product.active && <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold">Disembunyikan</span>}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black">{product.title}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    {product.discountPrice != null && <span className="text-lg font-black text-blue-400">{rupiah(product.discountPrice)}</span>}
                    <span className={product.discountPrice != null ? "text-sm text-slate-500 line-through" : "text-lg font-black text-blue-400"}>{rupiah(product.price)}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                    <span className="rounded-lg bg-white/5 p-2">{product.bundle}<br /><b className="text-slate-500">Bundle</b></span>
                    <span className="rounded-lg bg-white/5 p-2">{product.evoGun}<br /><b className="text-slate-500">Evo</b></span>
                    <span className="rounded-lg bg-white/5 p-2">{product.emote}<br /><b className="text-slate-500">Emote</b></span>
                    <span className="rounded-lg bg-white/5 p-2">{product.level}<br /><b className="text-slate-500">Level</b></span>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button onClick={() => edit(product)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold hover:bg-blue-500"><Pencil className="h-4 w-4" />Edit</button>
                    <button onClick={() => remove(product)} className="flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-red-300 hover:bg-red-500/20" aria-label={`Hapus ${product.title}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
