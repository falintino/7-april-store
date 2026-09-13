import { prisma } from "@/lib/prisma";

let ready = false;

export async function ensureAccountProductTable() {
  if (ready) return;

  const statements = [
    `CREATE TABLE IF NOT EXISTS "AccountProduct" (
      "id" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "discountPrice" INTEGER,
      "information" TEXT NOT NULL,
      "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "bundle" INTEGER NOT NULL DEFAULT 0,
      "evoGun" INTEGER NOT NULL DEFAULT 0,
      "emote" INTEGER NOT NULL DEFAULT 0,
      "level" INTEGER NOT NULL DEFAULT 0,
      "login" TEXT NOT NULL,
      "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
      "active" BOOLEAN NOT NULL DEFAULT true,
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "AccountProduct_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AccountProduct_slug_key" ON "AccountProduct"("slug")`,
    `CREATE INDEX IF NOT EXISTS "AccountProduct_active_idx" ON "AccountProduct"("active")`,
    `CREATE INDEX IF NOT EXISTS "AccountProduct_availability_idx" ON "AccountProduct"("availability")`,
  ];

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  const productCount = await prisma.accountProduct.count();

  if (productCount === 0) {
    await prisma.accountProduct.create({
      data: {
        slug: "sultan-evo-15",
        title: "Akun Sultan Evo 15",
        price: 1500000,
        information: "Akun Free Fire level 80 dengan 45 bundle, 8 Evo Gun, dan 120 emote. Konfirmasi koleksi, kondisi akun, dan metode serah terima kepada admin sebelum pembayaran.",
        imageUrls: [],
        bundle: 45,
        evoGun: 8,
        emote: 120,
        level: 80,
        login: "Google",
        availability: "AVAILABLE",
        active: true,
        featured: true,
      },
    });
  }

  ready = true;
}
