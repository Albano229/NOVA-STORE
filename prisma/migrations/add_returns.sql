CREATE TABLE IF NOT EXISTS "ReturnRequest" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT,
  "userId" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "refundAmount" FLOAT,
  "refundMethod" TEXT,
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "ReturnRequest_orderId_idx" ON "ReturnRequest"("orderId");
CREATE INDEX IF NOT EXISTS "ReturnRequest_userId_idx" ON "ReturnRequest"("userId");
CREATE INDEX IF NOT EXISTS "ReturnRequest_shopId_idx" ON "ReturnRequest"("shopId");
CREATE INDEX IF NOT EXISTS "ReturnRequest_status_idx" ON "ReturnRequest"("status");
