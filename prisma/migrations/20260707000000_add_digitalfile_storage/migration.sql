-- AlterTable
ALTER TABLE "DigitalFile" ADD COLUMN "storagePath" TEXT,
ADD COLUMN "storageBucket" TEXT DEFAULT 'nova-uploads';
