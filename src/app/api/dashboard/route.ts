import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      profiles: {
        select: {
          platform: true,
          username: true,
          rating: true,
          maxRating: true,
          rank: true,
          problemsSolved: true,
          lastFetched: true,
          rawData: true,
          topicStats: {
            select: { topicName: true, problemsCount: true },
            orderBy: { problemsCount: "desc" },
          },
          contestHistory: {
            select: {
              contestName: true,
              ratingAfter: true,
              rank: true,
              date: true,
            },
            orderBy: { date: "asc" },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const platforms: Record<string, unknown> = {};

  for (const profile of user.profiles) {
    platforms[profile.platform] = {
      username: profile.username,
      rating: profile.rating,
      maxRating: profile.maxRating,
      rank: profile.rank,
      problemsSolved: profile.problemsSolved,
      lastFetched: profile.lastFetched,
      rawData: profile.rawData,
      topicStats: profile.topicStats,
      contestHistory: profile.contestHistory,
    };
  }

  return NextResponse.json({
    name: user.name,
    platforms,
  });
}
