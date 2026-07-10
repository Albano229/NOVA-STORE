-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_shopId_key" ON "Wallet"("shopId");

-- CreateIndex
CREATE INDEX "Wallet_shopId_idx" ON "Wallet"("shopId");

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "requiresShippingAddress" BOOLEAN NOT NULL DEFAULT true;
