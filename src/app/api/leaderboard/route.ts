import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform } from "@prisma/client";

function compositeScore(cfRating: number, totalSolved: number): number {
  return Math.round(cfRating * 0.3 + totalSolved * 2);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "composite";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const registeredUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      college: true,
      profiles: {
        select: {
          platform: true,
          rating: true,
          maxRating: true,
          rank: true,
          problemsSolved: true,
          username: true,
          rawData: true,
        },
      },
    },
  });

  const discoveredUsers = await prisma.discoveredUser.findMany({
    orderBy: { cfRating: "desc" },
  });

  const watchedHandles = await prisma.watchedHandle.findMany({
    where: { userId },
    select: { cfHandle: true },
  });
  const watchedSet = new Set(watchedHandles.map((w) => w.cfHandle.toLowerCase()));

  type LeaderboardEntry = {
    id: string;
    type: "registered" | "discovered" | "watched";
    name: string;
    college: string;
    cfHandle: string;
    cfRating: number;
    cfMaxRating: number;
    cfRank: string;
    lcSolved: number;
    ccStars: string;
    gfgScore: number;
    totalSolved: number;
    compositeScore: number;
    isCurrentUser: boolean;
  };

  const entries: LeaderboardEntry[] = registeredUsers.map((u) => {
    const cf = u.profiles.find((p) => p.platform === Platform.CODEFORCES);
    const lc = u.profiles.find((p) => p.platform === Platform.LEETCODE);
    const cc = u.profiles.find((p) => p.platform === Platform.CODECHEF);
    const gfg = u.profiles.find((p) => p.platform === Platform.GFG);
    const lcRaw = lc?.rawData as { easySolved?: number; mediumSolved?: number; hardSolved?: number } | null;
    const ccRaw = cc?.rawData as { stars?: string } | null;
    const totalSolved =
      (cf?.problemsSolved ?? 0) +
      (lc?.problemsSolved ?? 0) +
      (cc?.problemsSolved ?? 0) +
      (gfg?.problemsSolved ?? 0);

    return {
      id: u.id,
      type: "registered",
      name: u.name,
      college: u.college,
      cfHandle: cf?.username ?? "",
      cfRating: cf?.rating ?? 0,
      cfMaxRating: cf?.maxRating ?? 0,
      cfRank: cf?.rank ?? "",
      lcSolved: lc?.problemsSolved ?? 0,
      ccStars: ccRaw?.stars ?? cc?.rank ?? "",
      gfgScore: gfg?.rating ?? 0,
      totalSolved,
      compositeScore: compositeScore(cf?.rating ?? 0, totalSolved),
      isCurrentUser: u.id === userId,
    };
  });

  const registeredHandlesLower = new Set(
    entries.map((e) => e.cfHandle.toLowerCase()).filter(Boolean)
  );

  for (const d of discoveredUsers) {
    const handleLower = d.cfHandle.toLowerCase();
    if (registeredHandlesLower.has(handleLower)) continue;

    const isWatched = watchedSet.has(handleLower);

    entries.push({
      id: d.id,
      type: isWatched ? "watched" : "discovered",
      name: d.cfHandle,
      college: d.organization ?? "IIT Jodhpur",
      cfHandle: d.cfHandle,
      cfRating: d.cfRating,
      cfMaxRating: d.cfMaxRating,
      cfRank: d.cfRank ?? "",
      lcSolved: 0,
      ccStars: "",
      gfgScore: 0,
      totalSolved: d.cfRating > 0 ? 0 : 0,
      compositeScore: compositeScore(d.cfRating, 0),
      isCurrentUser: false,
    });
  }

  for (const w of watchedHandles) {
    const handleLower = w.cfHandle.toLowerCase();
    if (
      registeredHandlesLower.has(handleLower) ||
      entries.some((e) => e.cfHandle.toLowerCase() === handleLower)
    )
      continue;

    entries.push({
      id: `watched-${w.cfHandle}`,
      type: "watched",
      name: w.cfHandle,
      college: "IIT Jodhpur",
      cfHandle: w.cfHandle,
      cfRating: 0,
      cfMaxRating: 0,
      cfRank: "",
      lcSolved: 0,
      ccStars: "",
      gfgScore: 0,
      totalSolved: 0,
      compositeScore: 0,
      isCurrentUser: false,
    });
  }

  const sortFn: Record<string, (a: LeaderboardEntry, b: LeaderboardEntry) => number> = {
    composite: (a, b) => b.compositeScore - a.compositeScore,
    cf_rating: (a, b) => b.cfRating - a.cfRating,
    lc_problems: (a, b) => b.lcSolved - a.lcSolved,
    total_problems: (a, b) => b.totalSolved - a.totalSolved,
    gfg_score: (a, b) => b.gfgScore - a.gfgScore,
  };

  const sorted = entries.sort(sortFn[sort] ?? sortFn.composite);
  const ranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  const paginated = ranked.slice(skip, skip + pageSize);

  return NextResponse.json({
    entries: paginated,
    total: sorted.length,
    page,
    pageSize,
    totalPages: Math.ceil(sorted.length / pageSize),
  });
}
