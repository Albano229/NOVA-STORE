CREATE TABLE IF NOT EXISTS "LoyaltyPoint" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "orderId" TEXT,
  "points" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LoyaltyPoint_userId_idx" ON "LoyaltyPoint"("userId");
CREATE INDEX IF NOT EXISTS "LoyaltyPoint_shopId_idx" ON "LoyaltyPoint"("shopId");
CREATE INDEX IF NOT EXISTS "LoyaltyPoint_userId_shopId_idx" ON "LoyaltyPoint"("userId", "shopId");

CREATE TABLE IF NOT EXISTS "LoyaltyConfig" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL UNIQUE,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "pointsPerCurrency" FLOAT NOT NULL DEFAULT 1.0,
  "redeemRate" FLOAT NOT NULL DEFAULT 100.0,
  "minRedeem" INTEGER NOT NULL DEFAULT 500,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LoyaltyConfig_shopId_idx" ON "LoyaltyConfig"("shopId");
