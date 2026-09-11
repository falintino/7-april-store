import { prisma } from "@/lib/prisma";
import { akunList } from "@/app/data/akun";

export type PublicAccountProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  discountPrice: number | null;
  information: string;
  imageUrls: string[];
  bundle: number;
  evoGun: number;
  emote: number;
  level: number;
  login: string;
  availability: string;
  featured: boolean;
};

function fallbackProducts(): PublicAccountProduct[] {
  return akunList.map((item) => ({
    id: String(item.id),
    slug: item.slug,
    title: item.nama,
    price: Number(item.harga.replace(/\D/g, "")),
    discountPrice: null,
    information: `Akun Free Fire level ${item.level} dengan ${item.bundle} bundle, ${item.evo} Evo Gun, dan ${item.emote} emote.`,
    imageUrls: [],
    bundle: item.bundle,
    evoGun: item.evo,
    emote: item.emote,
    level: item.level,
    login: item.login,
    availability: item.status === "Tersedia" ? "AVAILABLE" : "SOLD",
    featured: true,
  }));
}

export async function getPublicAccountProducts() {
  try {
    const products = await prisma.accountProduct.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
    return products.length ? products : fallbackProducts();
  } catch {
    return fallbackProducts();
  }
}

export async function getPublicAccountProduct(slug: string) {
  try {
    const product = await prisma.accountProduct.findFirst({
      where: { slug, active: true },
    });
    if (product) return product;
  } catch {}
  return fallbackProducts().find((item) => item.slug === slug) ?? null;
}

export function formatAccountPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}
