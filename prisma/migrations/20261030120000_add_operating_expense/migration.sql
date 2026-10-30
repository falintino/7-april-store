CREATE TABLE "OperatingExpense" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "spentAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperatingExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperatingExpense_spentAt_idx"
  ON "OperatingExpense"("spentAt");

CREATE INDEX "OperatingExpense_category_spentAt_idx"
  ON "OperatingExpense"("category", "spentAt");
