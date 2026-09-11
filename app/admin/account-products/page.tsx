import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AccountProductManager from "./AccountProductManager";

export const dynamic = "force-dynamic";

export default async function AdminAccountProductsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const products = await prisma.accountProduct.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              Admin Produk Akun
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Kelola Akun Game</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Tambah dan perbarui produk yang tampil pada marketplace akun 7 April Store.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10">← Dashboard</Link>
            <Link href="/akun" target="_blank" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500">Lihat Marketplace</Link>
          </div>
        </div>
        <AccountProductManager initialProducts={products.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        }))} />
      </div>
    </main>
  );
}
