import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform, SyncTrigger } from "@prisma/client";
import { fetchCCUserStats } from "@/lib/fetchers/codechef";
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
        platform: Platform.CODECHEF,
      },
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "No CodeChef handle configured. Add one in Settings." },
      { status: 400 }
    );
  }

  const runningJob = await getRunningJob(session.user.id, Platform.CODECHEF);
  if (runningJob) {
    return NextResponse.json(
      { error: "Sync already in progress" },
      { status: 409 }
    );
  }

  const job = await createSyncJob(
    session.user.id,
    Platform.CODECHEF,
    SyncTrigger.MANUAL
  );

  try {
    await markRunning(job.id);

    const stats = await fetchCCUserStats(profile.username);

    const previousSolved = profile.problemsSolved;
    const newProblems = Math.max(0, stats.problemsSolved - previousSolved);

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

    return NextResponse.json({
      success: true,
      newProblems,
      totalSolved: stats.problemsSolved,
      rating: stats.currentRating,
      highestRating: stats.highestRating,
      stars: stats.stars,
      globalRank: stats.globalRank,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markFailed(job.id, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
