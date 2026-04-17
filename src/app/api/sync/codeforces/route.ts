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
        platform: Platform.CODEFORCES,
      },
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "No Codeforces handle configured. Add one in Settings." },
      { status: 400 }
    );
  }

  const runningJob = await getRunningJob(session.user.id, Platform.CODEFORCES);
  if (runningJob) {
    return NextResponse.json(
      { error: "Sync already in progress" },
      { status: 409 }
    );
  }

  const job = await createSyncJob(
    session.user.id,
    Platform.CODEFORCES,
    SyncTrigger.MANUAL
  );

  try {
    await markRunning(job.id);

    const [userInfo, ratingHistory, submissions] = await Promise.all([
      fetchCFUserInfo(profile.username),
      fetchCFRatingHistory(profile.username),
      fetchCFSubmissions(profile.username),
    ]);

    const solvedProblems = extractSolvedProblems(submissions);
    const topicStats = computeTopicStats(solvedProblems);
    const previousSolved = profile.problemsSolved;
    const newProblems = Math.max(0, solvedProblems.length - previousSolved);

    await prisma.platformProfile.update({
      where: { id: profile.id },
      data: {
        rating: userInfo.rating ?? null,
        maxRating: userInfo.maxRating ?? null,
        rank: userInfo.rank ?? null,
        problemsSolved: solvedProblems.length,
        lastFetched: new Date(),
        rawData: {
          avatar: userInfo.avatar,
          organization: userInfo.organization,
          contribution: userInfo.contribution,
          friendOfCount: userInfo.friendOfCount,
          difficultyDistribution: Object.fromEntries(
            Object.entries(
              solvedProblems.reduce<Record<string, number>>((acc, sub) => {
                const r = sub.problem.rating;
                const bucket = r
                  ? `${Math.floor(r / 400) * 400}-${Math.floor(r / 400) * 400 + 399}`
                  : "Unrated";
                acc[bucket] = (acc[bucket] || 0) + 1;
                return acc;
              }, {})
            )
          ),
        },
      },
    });

    const topicUpserts = Object.entries(topicStats).map(([topicName, count]) =>
      prisma.topicStat.upsert({
        where: {
          profileId_topicName: { profileId: profile.id, topicName },
        },
        create: {
          profileId: profile.id,
          topicName,
          problemsCount: count,
        },
        update: {
          problemsCount: count,
          lastUpdated: new Date(),
        },
      })
    );
    await Promise.all(topicUpserts);

    const existingContests = await prisma.contestHistory.findMany({
      where: { profileId: profile.id },
      select: { contestName: true },
    });
    const existingNames = new Set(existingContests.map((c) => c.contestName));

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

    return NextResponse.json({
      success: true,
      newProblems,
      totalSolved: solvedProblems.length,
      rating: userInfo.rating,
      maxRating: userInfo.maxRating,
      rank: userInfo.rank,
      topicsCount: Object.keys(topicStats).length,
      contestsAdded: newContests.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.id, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
