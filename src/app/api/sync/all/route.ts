import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform, SyncTrigger } from "@prisma/client";
import {
  fetchCFUserInfo,
  fetchCFRatingHistory,
  fetchCFSubmissions,
  extractSolvedProblems,
  computeTopicStats,
} from "@/lib/fetchers/codeforces";
import {
  fetchLCUserStats,
  fetchLCTopicStats,
  fetchLCContestHistory,
} from "@/lib/fetchers/leetcode";
import { fetchCCUserStats } from "@/lib/fetchers/codechef";
import { fetchGFGUserStats } from "@/lib/fetchers/gfg";
import {
  createSyncJob,
  markRunning,
  markDone,
  markFailed,
  getRunningJob,
} from "@/lib/refresh/syncJob";

type PlatformResult =
  | { status: "ok"; newProblems: number; totalSolved: number }
  | { status: "skipped"; reason: string }
  | { status: "error"; error: string };

async function syncCF(
  userId: string
): Promise<PlatformResult> {
  const profile = await prisma.platformProfile.findUnique({
    where: { userId_platform: { userId, platform: Platform.CODEFORCES } },
  });
  if (!profile) return { status: "skipped", reason: "No handle configured" };

  const running = await getRunningJob(userId, Platform.CODEFORCES);
  if (running) return { status: "skipped", reason: "Already syncing" };

  const job = await createSyncJob(userId, Platform.CODEFORCES, SyncTrigger.MANUAL);
  try {
    await markRunning(job.id);
    const [userInfo, ratingHistory, submissions] = await Promise.all([
      fetchCFUserInfo(profile.username),
      fetchCFRatingHistory(profile.username),
      fetchCFSubmissions(profile.username),
    ]);
    const solved = extractSolvedProblems(submissions);
    const topics = computeTopicStats(solved);
    const newProblems = Math.max(0, solved.length - profile.problemsSolved);

    await prisma.platformProfile.update({
      where: { id: profile.id },
      data: {
        rating: userInfo.rating ?? null,
        maxRating: userInfo.maxRating ?? null,
        rank: userInfo.rank ?? null,
        problemsSolved: solved.length,
        lastFetched: new Date(),
        rawData: { avatar: userInfo.avatar, organization: userInfo.organization },
      },
    });
    await Promise.all(
      Object.entries(topics).map(([topicName, count]) =>
        prisma.topicStat.upsert({
          where: { profileId_topicName: { profileId: profile.id, topicName } },
          create: { profileId: profile.id, topicName, problemsCount: count },
          update: { problemsCount: count, lastUpdated: new Date() },
        })
      )
    );
    const existing = await prisma.contestHistory.findMany({
      where: { profileId: profile.id },
      select: { contestName: true },
    });
    const existingNames = new Set(existing.map((c) => c.contestName));
    const newContests = ratingHistory
      .filter((r) => !existingNames.has(r.contestName))
      .map((r) => ({
        profileId: profile.id,
        contestName: r.contestName,
        ratingAfter: r.newRating,
        rank: r.rank,
        date: new Date(r.ratingUpdateTimeSeconds * 1000),
      }));
    if (newContests.length > 0) {
      await prisma.contestHistory.createMany({ data: newContests });
    }
    await markDone(job.id, newProblems);
    return { status: "ok", newProblems, totalSolved: solved.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.id, message);
    return { status: "error", error: message };
  }
}

async function syncLC(userId: string): Promise<PlatformResult> {
  const profile = await prisma.platformProfile.findUnique({
    where: { userId_platform: { userId, platform: Platform.LEETCODE } },
  });
  if (!profile) return { status: "skipped", reason: "No handle configured" };

  const running = await getRunningJob(userId, Platform.LEETCODE);
  if (running) return { status: "skipped", reason: "Already syncing" };

  const job = await createSyncJob(userId, Platform.LEETCODE, SyncTrigger.MANUAL);
  try {
    await markRunning(job.id);
    const [userStats, topicStats, contestData] = await Promise.all([
      fetchLCUserStats(profile.username),
      fetchLCTopicStats(profile.username),
      fetchLCContestHistory(profile.username),
    ]);
    const newProblems = Math.max(0, userStats.totalSolved - profile.problemsSolved);
    await prisma.platformProfile.update({
      where: { id: profile.id },
      data: {
        problemsSolved: userStats.totalSolved,
        rating: contestData.ranking ? Math.round(contestData.ranking.rating) : null,
        rank: contestData.ranking ? `Top ${contestData.ranking.topPercentage.toFixed(1)}%` : null,
        lastFetched: new Date(),
        rawData: {
          easySolved: userStats.easySolved,
          mediumSolved: userStats.mediumSolved,
          hardSolved: userStats.hardSolved,
          ranking: userStats.ranking,
          contestRating: contestData.ranking?.rating ?? null,
          globalRanking: contestData.ranking?.globalRanking ?? null,
        },
      },
    });
    await Promise.all(
      Object.entries(topicStats).map(([topicName, count]) =>
        prisma.topicStat.upsert({
          where: { profileId_topicName: { profileId: profile.id, topicName } },
          create: { profileId: profile.id, topicName, problemsCount: count },
          update: { problemsCount: count, lastUpdated: new Date() },
        })
      )
    );
    const existing = await prisma.contestHistory.findMany({
      where: { profileId: profile.id },
      select: { contestName: true },
    });
    const existingNames = new Set(existing.map((c) => c.contestName));
    const newContests = contestData.history
      .filter((e) => !existingNames.has(e.contestTitle))
      .map((e) => ({
        profileId: profile.id,
        contestName: e.contestTitle,
        ratingAfter: e.rating,
        rank: e.ranking,
        date: new Date(e.date * 1000),
      }));
    if (newContests.length > 0) {
      await prisma.contestHistory.createMany({ data: newContests });
    }
    await markDone(job.id, newProblems);
    return { status: "ok", newProblems, totalSolved: userStats.totalSolved };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.id, message);
    return { status: "error", error: message };
  }
}

async function syncCC(userId: string): Promise<PlatformResult> {
  const profile = await prisma.platformProfile.findUnique({
    where: { userId_platform: { userId, platform: Platform.CODECHEF } },
  });
  if (!profile) return { status: "skipped", reason: "No handle configured" };

  const running = await getRunningJob(userId, Platform.CODECHEF);
  if (running) return { status: "skipped", reason: "Already syncing" };

  const job = await createSyncJob(userId, Platform.CODECHEF, SyncTrigger.MANUAL);
  try {
    await markRunning(job.id);
    const stats = await fetchCCUserStats(profile.username);
    const newProblems = Math.max(0, stats.problemsSolved - profile.problemsSolved);
    await prisma.platformProfile.update({
      where: { id: profile.id },
      data: {
        rating: stats.currentRating,
        maxRating: stats.highestRating,
        rank: stats.stars,
        problemsSolved: stats.problemsSolved,
        lastFetched: new Date(),
        rawData: {
          currentRating: stats.currentRating,
          highestRating: stats.highestRating,
          globalRank: stats.globalRank,
          countryRank: stats.countryRank,
          stars: stats.stars,
        },
      },
    });
    await markDone(job.id, newProblems);
    return { status: "ok", newProblems, totalSolved: stats.problemsSolved };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.id, message);
    return { status: "error", error: message };
  }
}

async function syncGFG(userId: string): Promise<PlatformResult> {
  const profile = await prisma.platformProfile.findUnique({
    where: { userId_platform: { userId, platform: Platform.GFG } },
  });
  if (!profile) return { status: "skipped", reason: "No handle configured" };

  const running = await getRunningJob(userId, Platform.GFG);
  if (running) return { status: "skipped", reason: "Already syncing" };

  const job = await createSyncJob(userId, Platform.GFG, SyncTrigger.MANUAL);
  try {
    await markRunning(job.id);
    const stats = await fetchGFGUserStats(profile.username);
    const newProblems = Math.max(0, stats.totalSolved - profile.problemsSolved);
    await prisma.platformProfile.update({
      where: { id: profile.id },
      data: {
        problemsSolved: stats.totalSolved,
        rating: stats.codingScore,
        rank: stats.instituteRank > 0 ? `Institute Rank #${stats.instituteRank}` : null,
        lastFetched: new Date(),
        rawData: {
          codingScore: stats.codingScore,
          institute: stats.institute,
          instituteRank: stats.instituteRank,
          school: stats.school,
          basic: stats.basic,
          easy: stats.easy,
          medium: stats.medium,
          hard: stats.hard,
          currentStreak: stats.currentStreak,
          maxStreak: stats.maxStreak,
        },
      },
    });
    const diffTopics: Array<[string, number]> = [
      ["School", stats.school],
      ["Basic", stats.basic],
      ["Easy", stats.easy],
      ["Medium", stats.medium],
      ["Hard", stats.hard],
    ];
    await Promise.all(
      diffTopics
        .filter(([, c]) => c > 0)
        .map(([topicName, count]) =>
          prisma.topicStat.upsert({
            where: { profileId_topicName: { profileId: profile.id, topicName } },
            create: { profileId: profile.id, topicName, problemsCount: count },
            update: { problemsCount: count, lastUpdated: new Date() },
          })
        )
    );
    await markDone(job.id, newProblems);
    return { status: "ok", newProblems, totalSolved: stats.totalSolved };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.id, message);
    return { status: "error", error: message };
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [cfResult, lcResult, ccResult, gfgResult] = await Promise.allSettled([
    syncCF(userId),
    syncLC(userId),
    syncCC(userId),
    syncGFG(userId),
  ]);

  const resolve = (r: PromiseSettledResult<PlatformResult>): PlatformResult =>
    r.status === "fulfilled"
      ? r.value
      : { status: "error", error: r.reason?.message ?? "Promise rejected" };

  const results = {
    CODEFORCES: resolve(cfResult),
    LEETCODE: resolve(lcResult),
    CODECHEF: resolve(ccResult),
    GFG: resolve(gfgResult),
  };

  const totalNewProblems = Object.values(results).reduce(
    (sum, r) => sum + (r.status === "ok" ? r.newProblems : 0),
    0
  );

  const anyOk = Object.values(results).some((r) => r.status === "ok");

  return NextResponse.json(
    { results, totalNewProblems },
    { status: anyOk ? 200 : 422 }
  );
}
