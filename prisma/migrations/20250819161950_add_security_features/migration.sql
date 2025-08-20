-- CreateTable
CREATE TABLE "IPRateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailDomainRateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailDomain" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DeviceFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "properties" TEXT NOT NULL,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userCount" INTEGER NOT NULL DEFAULT 1,
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 20,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "affiliateCode" TEXT,
    "referredBy" TEXT,
    "ipAddress" TEXT,
    "deviceFingerprint" TEXT,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" DATETIME,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "accountLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("affiliateCode", "createdAt", "credits", "email", "emailVerified", "id", "image", "name", "password", "plan", "referredBy", "stripeCustomerId", "updatedAt") SELECT "affiliateCode", "createdAt", "credits", "email", "emailVerified", "id", "image", "name", "password", "plan", "referredBy", "stripeCustomerId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_affiliateCode_key" ON "User"("affiliateCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "IPRateLimit_ipAddress_action_windowStart_idx" ON "IPRateLimit"("ipAddress", "action", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "IPRateLimit_ipAddress_action_windowStart_key" ON "IPRateLimit"("ipAddress", "action", "windowStart");

-- CreateIndex
CREATE INDEX "EmailDomainRateLimit_emailDomain_action_windowStart_idx" ON "EmailDomainRateLimit"("emailDomain", "action", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDomainRateLimit_emailDomain_action_windowStart_key" ON "EmailDomainRateLimit"("emailDomain", "action", "windowStart");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_idx" ON "SecurityLog"("userId");

-- CreateIndex
CREATE INDEX "SecurityLog_ipAddress_idx" ON "SecurityLog"("ipAddress");

-- CreateIndex
CREATE INDEX "SecurityLog_action_idx" ON "SecurityLog"("action");

-- CreateIndex
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityLog_severity_idx" ON "SecurityLog"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFingerprint_fingerprint_key" ON "DeviceFingerprint"("fingerprint");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_fingerprint_idx" ON "DeviceFingerprint"("fingerprint");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_ipAddress_idx" ON "DeviceFingerprint"("ipAddress");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_isSuspicious_idx" ON "DeviceFingerprint"("isSuspicious");
