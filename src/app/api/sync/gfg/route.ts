import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform, SyncTrigger } from "@prisma/client";
import { fetchGFGUserStats } from "@/lib/fetchers/gfg";
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
        platform: Platform.GFG,
      },
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "No GFG handle configured. Add one in Settings." },
      { status: 400 }
    );
  }

  const runningJob = await getRunningJob(session.user.id, Platform.GFG);
  if (runningJob) {
    return NextResponse.json(
      { error: "Sync already in progress" },
      { status: 409 }
    );
  }

  const job = await createSyncJob(
    session.user.id,
    Platform.GFG,
    SyncTrigger.MANUAL
  );

  try {
    await markRunning(job.id);

    const stats = await fetchGFGUserStats(profile.username);

    const previousSolved = profile.problemsSolved;
    const newProblems = Math.max(0, stats.totalSolved - previousSolved);

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
          contestRating: stats.contestRating,
        },
      },
    });

    const difficultyTopics: Array<[string, number]> = [
      ["School", stats.school],
      ["Basic", stats.basic],
      ["Easy", stats.easy],
      ["Medium", stats.medium],
      ["Hard", stats.hard],
    ];

    const topicUpserts = difficultyTopics
      .filter(([, count]) => count > 0)
      .map(([topicName, count]) =>
        prisma.topicStat.upsert({
          where: { profileId_topicName: { profileId: profile.id, topicName } },
          create: { profileId: profile.id, topicName, problemsCount: count },
          update: { problemsCount: count, lastUpdated: new Date() },
        })
      );
    await Promise.all(topicUpserts);

    await markDone(job.id, newProblems);

    return NextResponse.json({
      success: true,
      newProblems,
      totalSolved: stats.totalSolved,
      codingScore: stats.codingScore,
      institute: stats.institute,
      instituteRank: stats.instituteRank,
      school: stats.school,
      basic: stats.basic,
      easy: stats.easy,
      medium: stats.medium,
      hard: stats.hard,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.id, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
