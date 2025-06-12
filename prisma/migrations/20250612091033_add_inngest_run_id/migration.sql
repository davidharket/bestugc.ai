-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ad" (
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
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "finalVideoUrl" TEXT,
    "isWatermarked" BOOLEAN NOT NULL DEFAULT true,
    "inngestRunId" TEXT,
    CONSTRAINT "Ad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ad" ("audience", "avatarId", "brandName", "createdAt", "description", "duration", "finalVideoUrl", "format", "id", "isWatermarked", "language", "logoUrl", "originalPrice", "productUrl", "promoDetails", "promoPrice", "script", "selectedImages", "selectedVideos", "showPromo", "status", "summary", "templateId", "updatedAt", "userId") SELECT "audience", "avatarId", "brandName", "createdAt", "description", "duration", "finalVideoUrl", "format", "id", "isWatermarked", "language", "logoUrl", "originalPrice", "productUrl", "promoDetails", "promoPrice", "script", "selectedImages", "selectedVideos", "showPromo", "status", "summary", "templateId", "updatedAt", "userId" FROM "Ad";
DROP TABLE "Ad";
ALTER TABLE "new_Ad" RENAME TO "Ad";
CREATE UNIQUE INDEX "Ad_inngestRunId_key" ON "Ad"("inngestRunId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
