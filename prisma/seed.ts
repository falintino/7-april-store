import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Sinkronisasi produk Free Fire...");

  // Nonaktifkan dulu seluruh produk Free Fire.
  // Produk yang memang tersedia akan diaktifkan kembali lewat upsert di bawah.
  // Ini lebih aman daripada deleteMany karena histori Order tetap terjaga.
  await prisma.product.updateMany({
    where: {
      game: "Free Fire",
    },
    data: {
      active: false,
    },
  });

  const products = [
    {
      game: "Free Fire",
      name: "5 Diamond",
      sku: "FF5",
      providerCode: "ff5",
      price: 750,
      providerPrice: 750,
      popular: false,
      active: true,
    },
    {
      game: "Free Fire",
      name: "12 Diamond",
      sku: "FF12",
      providerCode: "ff12",
      price: 1615,
      providerPrice: 1615,
      popular: true,
      active: true,
    },
    {
      game: "Free Fire",
      name: "50 Diamond",
      sku: "FF50",
      providerCode: "ff50",
      price: 4980,
      providerPrice: 4980,
      popular: true,
      active: true,
    },
    {
      game: "Free Fire",
      name: "70 Diamond",
      sku: "FF70",
      providerCode: "ff70",
      price: 7000,
      providerPrice: 7000,
      popular: true,
      active: true,
    },
    {
      game: "Free Fire",
      name: "140 Diamond",
      sku: "FF140",
      providerCode: "ff140",
      price: 11000,
      providerPrice: 11000,
      popular: true,
      active: true,
    },
    {
      game: "Free Fire",
      name: "355 Diamond",
      sku: "FF355",
      providerCode: "ff355",
      price: 28500,
      providerPrice: 28500,
      popular: true,
      active: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        sku: product.sku,
      },
      update: {
        game: product.game,
        name: product.name,
        providerCode: product.providerCode,
        price: product.price,
        providerPrice: product.providerPrice,
        popular: product.popular,
        active: product.active,
      },
      create: product,
    });

    console.log(
      `✅ ${product.name} | ${product.providerCode} | Rp${product.price.toLocaleString(
        "id-ID"
      )}`
    );
  }

  console.log("");
  console.log("✅ Sinkronisasi produk Free Fire selesai.");
  console.log("✅ Histori order lama tetap aman.");
  console.log("✅ Produk 720 dan 1450 Diamond dinonaktifkan.");
}

main()
  .catch((error) => {
    console.error("❌ Seeder gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });