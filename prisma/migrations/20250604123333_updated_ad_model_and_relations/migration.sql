/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
    "canceledAt" DATETIME,
    "trialStart" DATETIME,
    "trialEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "productUrl" TEXT,
    "summary" TEXT,
    "brandName" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "selectedImages" TEXT,
    "selectedVideos" TEXT,
    "showPromo" BOOLEAN DEFAULT false,
    "originalPrice" TEXT,
    "promoPrice" TEXT,
    "promoDetails" TEXT,
    "format" TEXT,
    "duration" INTEGER,
    "language" TEXT,
    "audience" TEXT,
    "script" TEXT,
    "avatarId" INTEGER,
    "templateId" INTEGER,
    "finalVideoUrl" TEXT,
    "isWatermarked" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Ad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
