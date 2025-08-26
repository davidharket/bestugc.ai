-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sceneDescription" TEXT NOT NULL,
    "sceneImageUrl" TEXT NOT NULL,
    "productImageUrls" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "enhancedDescription" TEXT,
    "aiEnhanced" BOOLEAN NOT NULL DEFAULT false,
    "runwayTaskId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ProductImage_userId_idx" ON "ProductImage"("userId");

-- CreateIndex
CREATE INDEX "ProductImage_status_idx" ON "ProductImage"("status");

-- CreateIndex
CREATE INDEX "ProductImage_createdAt_idx" ON "ProductImage"("createdAt");
