-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT
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
    "selectedBRoll" TEXT,
    "orderedImages" TEXT,
    "orderedVideos" TEXT,
    "orderedBRoll" TEXT,
    "showPromo" BOOLEAN DEFAULT false,
    "originalPrice" TEXT,
    "promoPrice" TEXT,
    "promoDetails" TEXT,
    "format" TEXT,
    "duration" INTEGER,
    "language" TEXT,
    "audience" TEXT,
    "script" TEXT,
    "avatarId" TEXT,
    "templateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "finalVideoUrl" TEXT,
    "isWatermarked" BOOLEAN NOT NULL DEFAULT true,
    "inngestRunId" TEXT,
    "syncLabsJobId" TEXT,
    "backgroundMusicUrl" TEXT,
    "backgroundMusicVolume" INTEGER,
    "enableDualFormat" BOOLEAN DEFAULT false,
    "finalVideoUrl4x5" TEXT,
    "lipsyncedAvatarNoBgUrl" TEXT,
    "lipsyncedAvatarUrl" TEXT,
    "fontSize" INTEGER DEFAULT 50,
    "oneWordAtATime" BOOLEAN DEFAULT false,
    "enableSubtitles" BOOLEAN DEFAULT true,
    "fontWeight" INTEGER DEFAULT 700,
    "letterSpacing" INTEGER,
    "outlineColor" TEXT,
    "outlineWidth" INTEGER,
    "shadowBlur" INTEGER,
    "shadowColor" TEXT,
    "shadowOffsetX" INTEGER,
    "shadowOffsetY" INTEGER,
    "subtitleAnimation" TEXT DEFAULT 'none',
    "subtitlePosition" TEXT DEFAULT 'bottom',
    "subtitleStyle" TEXT DEFAULT 'inter',
    "textColor" TEXT DEFAULT '#ffffff',
    "textTransform" TEXT
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "affiliateCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "commissionRate" REAL NOT NULL DEFAULT 0.10,
    "payoutMethod" TEXT,
    "payoutDetails" TEXT,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "paidOut" REAL NOT NULL DEFAULT 0,
    "pendingPayout" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliateId" TEXT NOT NULL,
    "affiliateCode" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT NOT NULL,
    "country" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralId" TEXT,
    "subscriptionId" TEXT,
    "amount" REAL NOT NULL,
    "percentage" REAL NOT NULL,
    "purchaseAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL,
    "payoutId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Creation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT,
    "assets" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "watermarked" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliateId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripePayoutId" TEXT,
    "paypalPayoutId" TEXT,
    "failureReason" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RateLimitUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliateCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "signupDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversionDate" DATETIME,
    "firstPurchaseAmount" REAL,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 20,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "affiliateCode" TEXT,
    "referredBy" TEXT
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VisitorStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider" ASC, "providerAccountId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Ad_inngestRunId_key" ON "Ad"("inngestRunId" ASC);

-- CreateIndex
CREATE INDEX "Affiliate_isActive_idx" ON "Affiliate"("isActive" ASC);

-- CreateIndex
CREATE INDEX "Affiliate_affiliateCode_idx" ON "Affiliate"("affiliateCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_affiliateCode_key" ON "Affiliate"("affiliateCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "Affiliate"("userId" ASC);

-- CreateIndex
CREATE INDEX "AffiliateClick_converted_idx" ON "AffiliateClick"("converted" ASC);

-- CreateIndex
CREATE INDEX "AffiliateClick_createdAt_idx" ON "AffiliateClick"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AffiliateClick_affiliateCode_idx" ON "AffiliateClick"("affiliateCode" ASC);

-- CreateIndex
CREATE INDEX "AffiliateClick_affiliateId_idx" ON "AffiliateClick"("affiliateId" ASC);

-- CreateIndex
CREATE INDEX "Commission_type_idx" ON "Commission"("type" ASC);

-- CreateIndex
CREATE INDEX "Commission_createdAt_idx" ON "Commission"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status" ASC);

-- CreateIndex
CREATE INDEX "Commission_affiliateId_idx" ON "Commission"("affiliateId" ASC);

-- CreateIndex
CREATE INDEX "Payout_createdAt_idx" ON "Payout"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status" ASC);

-- CreateIndex
CREATE INDEX "Payout_affiliateId_idx" ON "Payout"("affiliateId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitUsage_userId_action_windowStart_key" ON "RateLimitUsage"("userId" ASC, "action" ASC, "windowStart" ASC);

-- CreateIndex
CREATE INDEX "RateLimitUsage_userId_action_windowStart_idx" ON "RateLimitUsage"("userId" ASC, "action" ASC, "windowStart" ASC);

-- CreateIndex
CREATE INDEX "Referral_signupDate_idx" ON "Referral"("signupDate" ASC);

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status" ASC);

-- CreateIndex
CREATE INDEX "Referral_userId_idx" ON "Referral"("userId" ASC);

-- CreateIndex
CREATE INDEX "Referral_affiliateId_idx" ON "Referral"("affiliateId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_affiliateCode_key" ON "User"("affiliateCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier" ASC, "token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token" ASC);

-- CreateIndex
CREATE INDEX "VisitorStats_timestamp_idx" ON "VisitorStats"("timestamp" ASC);

-- CreateIndex
CREATE INDEX "VisitorStats_sessionId_idx" ON "VisitorStats"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "VisitorStats_page_timestamp_idx" ON "VisitorStats"("page" ASC, "timestamp" ASC);

