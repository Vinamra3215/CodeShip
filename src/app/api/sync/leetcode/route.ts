import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform, SyncTrigger } from "@prisma/client";
import {
  fetchLCUserStats,
  fetchLCTopicStats,
  fetchLCContestHistory,
} from "@/lib/fetchers/leetcode";
import {
  createSyncJob,
  markRunning,
  markDone,
  markFailed,
  getRunningJob,
} from "@/lib/refresh/syncJob";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.platformProfile.findUnique({
    where: {
      userId_platform: {
        userId: session.user.id,
        platform: Platform.LEETCODE,
      },
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "No LeetCode handle configured. Add one in Settings." },
      { status: 400 }
    );
  }

  const runningJob = await getRunningJob(session.user.id, Platform.LEETCODE);
  if (runningJob) {
    return NextResponse.json(
      { error: "Sync already in progress" },
      { status: 409 }
    );
  }

  const job = await createSyncJob(
    session.user.id,
    Platform.LEETCODE,
    SyncTrigger.MANUAL
  );

  try {
    await markRunning(job.id);

    const [userStats, topicStats, contestData] = await Promise.all([
      fetchLCUserStats(profile.username),
      fetchLCTopicStats(profile.username),
      fetchLCContestHistory(profile.username),
    ]);

    const previousSolved = profile.problemsSolved;
    const newProblems = Math.max(0, userStats.totalSolved - previousSolved);

    await prisma.platformProfile.update({
      where: { id: profile.id },
      data: {
        problemsSolved: userStats.totalSolved,
        rating: contestData.ranking ? Math.round(contestData.ranking.rating) : null,
        rank: contestData.ranking
          ? `Top ${contestData.ranking.topPercentage.toFixed(1)}%`
          : null,
        lastFetched: new Date(),
        rawData: {
          easySolved: userStats.easySolved,
          mediumSolved: userStats.mediumSolved,
          hardSolved: userStats.hardSolved,
          ranking: userStats.ranking,
          acceptanceRate: userStats.acceptanceRate,
          contestRating: contestData.ranking?.rating ?? null,
          globalRanking: contestData.ranking?.globalRanking ?? null,
          attendedContestsCount: contestData.ranking?.attendedContestsCount ?? 0,
          topPercentage: contestData.ranking?.topPercentage ?? null,
        },
      },
    });

    const topicUpserts = Object.entries(topicStats).map(([topicName, count]) =>
      prisma.topicStat.upsert({
        where: { profileId_topicName: { profileId: profile.id, topicName } },
        create: { profileId: profile.id, topicName, problemsCount: count },
        update: { problemsCount: count, lastUpdated: new Date() },
      })
    );
    await Promise.all(topicUpserts);

    const existingContests = await prisma.contestHistory.findMany({
      where: { profileId: profile.id },
      select: { contestName: true },
    });
    const existingNames = new Set(existingContests.map((c) => c.contestName));

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

    return NextResponse.json({
      success: true,
      newProblems,
      totalSolved: userStats.totalSolved,
      easySolved: userStats.easySolved,
      mediumSolved: userStats.mediumSolved,
      hardSolved: userStats.hardSolved,
      ranking: userStats.ranking,
      contestRating: contestData.ranking?.rating ?? null,
      contestsAdded: newContests.length,
      topicsCount: Object.keys(topicStats).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.id, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
