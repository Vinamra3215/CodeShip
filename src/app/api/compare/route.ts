import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawHandles = searchParams.get("handles") ?? "";
  const handles = rawHandles
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (handles.length === 0) {
    return NextResponse.json({ error: "At least one handle is required" }, { status: 400 });
  }

  const results = await Promise.all(
    handles.map(async (handle) => {
      const user = await prisma.user.findFirst({
        where: {
          profiles: {
            some: {
              platform: Platform.CODEFORCES,
              username: { equals: handle, mode: "insensitive" },
            },
          },
        },
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

      if (user) {
        const cf = user.profiles.find((p) => p.platform === Platform.CODEFORCES);
        const lc = user.profiles.find((p) => p.platform === Platform.LEETCODE);
        const cc = user.profiles.find((p) => p.platform === Platform.CODECHEF);
        const gfg = user.profiles.find((p) => p.platform === Platform.GFG);
        const lcRaw = lc?.rawData as {
          easySolved?: number;
          mediumSolved?: number;
          hardSolved?: number;
        } | null;
        const ccRaw = cc?.rawData as { stars?: string } | null;

        return {
          handle,
          name: user.name,
          college: user.college,
          isRegistered: true,
          cfRating: cf?.rating ?? 0,
          cfMaxRating: cf?.maxRating ?? 0,
          cfRank: cf?.rank ?? "",
          lcEasy: lcRaw?.easySolved ?? 0,
          lcMedium: lcRaw?.mediumSolved ?? 0,
          lcHard: lcRaw?.hardSolved ?? 0,
          lcTotal: lc?.problemsSolved ?? 0,
          ccRating: cc?.rating ?? 0,
          ccStars: ccRaw?.stars ?? "",
          gfgScore: gfg?.rating ?? 0,
          gfgSolved: gfg?.problemsSolved ?? 0,
          totalSolved:
            (cf?.problemsSolved ?? 0) +
            (lc?.problemsSolved ?? 0) +
            (cc?.problemsSolved ?? 0) +
            (gfg?.problemsSolved ?? 0),
        };
      }

      const discovered = await prisma.discoveredUser.findUnique({
        where: { cfHandle: handle },
      });

      if (discovered) {
        return {
          handle,
          name: discovered.cfHandle,
          college: discovered.organization ?? "IIT Jodhpur",
          isRegistered: false,
          cfRating: discovered.cfRating,
          cfMaxRating: discovered.cfMaxRating,
          cfRank: discovered.cfRank ?? "",
          lcEasy: 0,
          lcMedium: 0,
          lcHard: 0,
          lcTotal: 0,
          ccRating: 0,
          ccStars: "",
          gfgScore: 0,
          gfgSolved: 0,
          totalSolved: 0,
        };
      }

      return null;
    })
  );

  return NextResponse.json({ users: results.filter(Boolean) });
}
