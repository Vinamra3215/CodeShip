import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform } from "@prisma/client";

interface RatingPoint {
  platform: string;
  date: string;
  rating: number;
  contestName: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result: RatingPoint[] = [];

  const cfProfile = await prisma.platformProfile.findUnique({
    where: {
      userId_platform: {
        userId: session.user.id,
        platform: Platform.CODEFORCES,
      },
    },
  });

  if (cfProfile) {
    const raw = cfProfile.rawData as { ratingHistory?: Array<{
      contestName: string;
      ratingUpdateTimeSeconds: number;
      newRating: number;
    }> } | null;

    if (raw?.ratingHistory) {
      for (const entry of raw.ratingHistory) {
        result.push({
          platform: "Codeforces",
          date: new Date(entry.ratingUpdateTimeSeconds * 1000).toISOString().slice(0, 10),
          rating: entry.newRating,
          contestName: entry.contestName,
        });
      }
    }
  }

  const lcProfile = await prisma.platformProfile.findUnique({
    where: {
      userId_platform: {
        userId: session.user.id,
        platform: Platform.LEETCODE,
      },
    },
  });

  if (lcProfile) {
    const raw = lcProfile.rawData as { contestHistory?: Array<{
      contest: { title: string; startTime: number };
      rating: number;
    }> } | null;

    if (raw?.contestHistory) {
      for (const entry of raw.contestHistory) {
        result.push({
          platform: "LeetCode",
          date: new Date(entry.contest.startTime * 1000).toISOString().slice(0, 10),
          rating: Math.round(entry.rating),
          contestName: entry.contest.title,
        });
      }
    }
  }

  const ccProfile = await prisma.platformProfile.findUnique({
    where: {
      userId_platform: {
        userId: session.user.id,
        platform: Platform.CODECHEF,
      },
    },
  });

  if (ccProfile) {
    const raw = ccProfile.rawData as { ratingHistory?: Array<{
      name: string;
      end_date: string;
      rating: number;
    }> } | null;

    if (raw?.ratingHistory) {
      for (const entry of raw.ratingHistory) {
        result.push({
          platform: "CodeChef",
          date: entry.end_date.slice(0, 10),
          rating: entry.rating,
          contestName: entry.name,
        });
      }
    }
  }

  result.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ history: result });
}
