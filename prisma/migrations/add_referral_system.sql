-- Referral system: add referralCode + referredById to User, create Referral + ReferralConfig tables

-- 1. Add referral fields to User
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;

-- 2. Create unique index on referralCode
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- 3. Create ReferralConfig table
CREATE TABLE "ReferralConfig" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 500,
  "rewardType" TEXT NOT NULL DEFAULT 'CREDIT',
  "minPurchaseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxReferralsPerUser" INTEGER NOT NULL DEFAULT 50,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Referral table
CREATE TABLE "Referral" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "referrerId" TEXT NOT NULL,
  "refereeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "rewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "rewardGivenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- 5. Add FK for User.referredById
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL;

-- 6. Indexes
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX "Referral_refereeId_idx" ON "Referral"("refereeId");
CREATE INDEX "Referral_code_idx" ON "Referral"("code");
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- 7. Insert default config
INSERT INTO "ReferralConfig" ("id", "rewardAmount", "rewardType", "minPurchaseAmount", "maxReferralsPerUser", "isActive")
VALUES ('default', 500, 'CREDIT', 0, 50, true);

-- 8. Generate referral codes for existing users (8-char uppercase alphanumeric)
UPDATE "User" SET "referralCode" = UPPER(SUBSTRING(MD5(RANDOM()::text || "id") FOR 8));
