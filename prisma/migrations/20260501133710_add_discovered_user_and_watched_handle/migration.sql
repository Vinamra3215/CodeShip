-- CreateTable
CREATE TABLE "discovered_users" (
    "id" TEXT NOT NULL,
    "cfHandle" TEXT NOT NULL,
    "cfRating" INTEGER NOT NULL DEFAULT 0,
    "cfMaxRating" INTEGER NOT NULL DEFAULT 0,
    "cfRank" TEXT,
    "organization" TEXT,
    "avatar" TEXT,
    "country" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovered_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watched_handles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cfHandle" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watched_handles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discovered_users_cfHandle_key" ON "discovered_users"("cfHandle");

-- CreateIndex
CREATE INDEX "discovered_users_cfRating_idx" ON "discovered_users"("cfRating");

-- CreateIndex
CREATE INDEX "watched_handles_userId_idx" ON "watched_handles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watched_handles_userId_cfHandle_key" ON "watched_handles"("userId", "cfHandle");

-- AddForeignKey
ALTER TABLE "watched_handles" ADD CONSTRAINT "watched_handles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
