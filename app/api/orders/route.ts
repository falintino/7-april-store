import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateInvoice() {
  const now = new Date();

  const year = now
    .getFullYear()
    .toString();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const random =
    Math.floor(
      100000 +
        Math.random() * 900000
    );

  return `7A-${year}${month}${day}-${random}`;
}

async function createUniqueInvoice() {
  for (
    let attempt = 0;
    attempt < 5;
    attempt++
  ) {
    const invoice =
      generateInvoice();

    const existing =
      await prisma.order.findUnique({
        where: {
          invoice,
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      return invoice;
    }
  }

  throw new Error(
    "Gagal membuat nomor invoice unik."
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const uid = String(
      body.uid ?? ""
    ).trim();

    const whatsapp = String(
      body.whatsapp ?? ""
    ).trim();

    const productId = String(
      body.productId ?? ""
    ).trim();

    /*
     * =====================================
     * VALIDASI INPUT
     * =====================================
     *
     * Browser hanya boleh menentukan:
     *
     * - UID
     * - WhatsApp
     * - productId
     *
     * Browser TIDAK menentukan:
     *
     * - harga jual
     * - modal provider
     * - subtotal
     * - discountAmount
     * - total
     *
     * Semua nilai harga selalu ditentukan
     * oleh server dari database.
     */

    if (
      !uid ||
      !whatsapp ||
      !productId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data pesanan belum lengkap.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================
     * VALIDASI UID FREE FIRE
     * =====================================
     */

    if (
      !/^\d{6,}$/.test(uid)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "UID Free Fire tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================
     * VALIDASI NOMOR WHATSAPP
     * =====================================
     */

    if (
      !/^\d{10,15}$/.test(
        whatsapp
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nomor WhatsApp tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================
     * AMBIL PRODUK DARI DATABASE
     * =====================================
     *
     * Harga dari browser tidak dipercaya.
     *
     * Browser hanya mengirim productId.
     *
     * Server kemudian mengambil:
     *
     * product.price
     * =
     * harga jual 7 April Store.
     *
     * product.providerPrice
     * =
     * modal Digiflazz saat ini.
     */

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Produk tidak ditemukan di database.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =====================================
     * PRODUK HARUS AKTIF
     * =====================================
     */

    if (!product.active) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Produk sedang tidak aktif.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================
     * VALIDASI GAME
     * =====================================
     *
     * Normalisasi supaya:
     *
     * Free Fire
     * FREE FIRE
     * free_fire
     * free-fire
     *
     * tetap dikenali sebagai Free Fire.
     */

    const normalizedGame =
      product.game
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    if (
      normalizedGame !==
      "free fire"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Produk yang dipilih bukan produk Free Fire.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================
     * SNAPSHOT HARGA ORDER
     * =====================================
     *
     * Sekarang kita mempunyai tiga nilai
     * penting pada Order:
     *
     * subtotal
     * discountAmount
     * total
     *
     * Ketika order BARU dibuat,
     * promo belum diterapkan.
     *
     * Maka:
     *
     * subtotal
     * =
     * harga jual produk saat order dibuat.
     *
     * discountAmount
     * =
     * 0
     *
     * total
     * =
     * subtotal
     *
     *
     * CONTOH:
     *
     * 140 Diamond
     *
     * product.price = 17.211
     *
     * Order baru:
     *
     * subtotal       = 17.211
     * discountAmount = 0
     * total          = 17.211
     *
     * Kalau nanti promo Rp2.000 diterapkan
     * pada tahap pembayaran:
     *
     * subtotal       = 17.211
     * discountAmount = 2.000
     * total          = 15.211
     *
     * subtotal TIDAK berubah.
     */

    const subtotal =
      product.price;

    const discountAmount =
      0;

    const total =
      subtotal;

    /*
     * =====================================
     * SNAPSHOT MODAL PROVIDER
     * =====================================
     *
     * providerPriceSnapshot:
     *
     * modal Digiflazz pada SAAT
     * order dibuat.
     *
     * Nilai ini sangat penting.
     *
     * Contoh:
     *
     * product.providerPrice = 11.000
     *
     * Maka:
     *
     * providerPriceSnapshot = 11.000
     *
     * Kalau beberapa menit kemudian
     * Product.providerPrice berubah
     * menjadi 11.500 karena price sync,
     * order lama tetap memiliki:
     *
     * providerPriceSnapshot = 11.000
     *
     * Jadi perhitungan transaksi order lama
     * tidak berubah hanya karena modal
     * provider terbaru berubah.
     */

    const providerPriceSnapshot =
      product.providerPrice;

    /*
     * =====================================
     * VALIDASI SUBTOTAL
     * =====================================
     */

    if (
      !Number.isInteger(
        subtotal
      ) ||
      subtotal <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Harga produk tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =====================================
     * VALIDASI DISCOUNT AMOUNT AWAL
     * =====================================
     *
     * Order baru belum memiliki promo,
     * sehingga harus selalu 0.
     */

    if (
      !Number.isInteger(
        discountAmount
      ) ||
      discountAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nilai diskon tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =====================================
     * VALIDASI TOTAL
     * =====================================
     */

    if (
      !Number.isInteger(total) ||
      total <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Total pesanan tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =====================================
     * VALIDASI MODAL PROVIDER
     * =====================================
     */

    if (
      !Number.isInteger(
        providerPriceSnapshot
      ) ||
      providerPriceSnapshot <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Harga provider tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =====================================
     * PENGAMAN DASAR HARGA
     * =====================================
     *
     * Bahkan sebelum promo digunakan,
     * harga jual produk tidak boleh
     * berada di bawah modal provider.
     *
     * Ini bukan pengganti minimumMargin
     * pada promo.
     *
     * Ini hanya pengaman dasar supaya
     * database tidak secara tidak sengaja
     * membuat order yang sejak awal
     * sudah dijual rugi.
     */

    if (
      subtotal <
      providerPriceSnapshot
    ) {
      console.error(
        "CREATE ORDER BELOW PROVIDER PRICE:",
        {
          productId:
            product.id,

          sku:
            product.sku,
        }
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Harga produk sedang diperbarui. Silakan coba lagi.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =====================================
     * BUAT INVOICE
     * =====================================
     */

    const invoice =
      await createUniqueInvoice();

    /*
     * =====================================
     * BUAT ORDER
     * =====================================
     *
     * Semua snapshot harga disimpan
     * bersamaan ketika order dibuat.
     *
     * Browser tidak mempunyai kesempatan
     * untuk menentukan nilai-nilai ini.
     */

    const order =
      await prisma.order.create({
        data: {
          invoice,

          uid,

          server: null,

          whatsapp,

          paymentMethod:
            "PENDING",

          paymentStatus:
            "PENDING",

          providerStatus:
            "PENDING",

          /*
           * Harga jual sebelum promo.
           */
          subtotal,

          /*
           * Order baru belum memiliki promo.
           */
          discountAmount,

          /*
           * Total awal sama dengan subtotal.
           *
           * Jika promo diskon diterapkan
           * nanti, backend Midtrans yang
           * akan memperbarui total.
           */
          total,

          /*
           * Snapshot modal provider.
           */
          providerPriceSnapshot,

          productId:
            product.id,
        },

        include: {
          product: {
            select: {
              id: true,
              game: true,
              name: true,
              sku: true,
              providerCode: true,
              price: true,
              providerPrice: true,
              popular: true,
            },
          },
        },
      });

    /*
     * =====================================
     * RESPONSE KE FRONTEND
     * =====================================
     *
     * Kita hanya mengirim informasi
     * yang memang dibutuhkan frontend.
     *
     * Data internal seperti:
     *
     * providerPrice
     * providerPriceSnapshot
     *
     * TIDAK dikirim ke browser.
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Pesanan berhasil dibuat.",

        order: {
          id:
            order.id,

          invoice:
            order.invoice,

          uid:
            order.uid,

          whatsapp:
            order.whatsapp,

          /*
           * Harga sebelum promo.
           */
          subtotal:
            order.subtotal,

          /*
           * Diskon awal selalu 0.
           */
          discountAmount:
            order.discountAmount,

          /*
           * Total awal.
           */
          total:
            order.total,

          paymentStatus:
            order.paymentStatus,

          providerStatus:
            order.providerStatus,

          product: {
            id:
              order.product.id,

            game:
              order.product.game,

            name:
              order.product.name,

            sku:
              order.product.sku,

            price:
              order.product.price,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan saat membuat pesanan.",
      },
      {
        status: 500,
      }
    );
  }
}