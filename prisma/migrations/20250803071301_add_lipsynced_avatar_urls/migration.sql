-- Add lipsynced avatar URL fields to Ad table
ALTER TABLE "Ad" ADD COLUMN "lipsyncedAvatarUrl" TEXT;
ALTER TABLE "Ad" ADD COLUMN "lipsyncedAvatarNoBgUrl" TEXT;