-- CreateTable
CREATE TABLE "AccountProduct" (
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
);

CREATE UNIQUE INDEX "AccountProduct_slug_key" ON "AccountProduct"("slug");
CREATE INDEX "AccountProduct_active_idx" ON "AccountProduct"("active");
CREATE INDEX "AccountProduct_availability_idx" ON "AccountProduct"("availability");
