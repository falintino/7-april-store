ALTER TABLE "Review"
  ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'VISIBLE',
  ADD COLUMN "moderationReason" TEXT,
  ADD COLUMN "moderatedAt" TIMESTAMP(3),
  ADD COLUMN "moderatedBy" TEXT;

CREATE INDEX "Review_moderationStatus_createdAt_idx"
  ON "Review"("moderationStatus", "createdAt");

CREATE TABLE "ReviewAudit" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" VARCHAR(500),
  "adminIdentifier" TEXT NOT NULL DEFAULT 'admin',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReviewAudit_reviewId_createdAt_idx"
  ON "ReviewAudit"("reviewId", "createdAt");
CREATE INDEX "ReviewAudit_action_createdAt_idx"
  ON "ReviewAudit"("action", "createdAt");

ALTER TABLE "ReviewAudit"
  ADD CONSTRAINT "ReviewAudit_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "Review"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
