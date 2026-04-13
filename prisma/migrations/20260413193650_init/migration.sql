-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('CODEFORCES', 'LEETCODE', 'CODECHEF', 'GFG');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "SyncTrigger" AS ENUM ('CRON', 'MANUAL', 'STALENESS', 'LOGIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "college" TEXT NOT NULL DEFAULT 'IIT Jodhpur',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "username" TEXT NOT NULL,
    "rating" INTEGER,
    "maxRating" INTEGER,
    "rank" TEXT,
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "lastFetched" TIMESTAMP(3),
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_stats" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "problemsCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_history" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "contestName" TEXT NOT NULL,
    "ratingAfter" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contest_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredBy" "SyncTrigger" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "newProblemsFound" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "platform_profiles_userId_idx" ON "platform_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_profiles_userId_platform_key" ON "platform_profiles"("userId", "platform");

-- CreateIndex
CREATE INDEX "topic_stats_profileId_idx" ON "topic_stats"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "topic_stats_profileId_topicName_key" ON "topic_stats"("profileId", "topicName");

-- CreateIndex
CREATE INDEX "contest_history_profileId_idx" ON "contest_history"("profileId");

-- CreateIndex
CREATE INDEX "sync_jobs_userId_status_idx" ON "sync_jobs"("userId", "status");

-- CreateIndex
CREATE INDEX "sync_jobs_userId_platform_idx" ON "sync_jobs"("userId", "platform");

-- AddForeignKey
ALTER TABLE "platform_profiles" ADD CONSTRAINT "platform_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_stats" ADD CONSTRAINT "topic_stats_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "platform_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_history" ADD CONSTRAINT "contest_history_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "platform_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
