import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Platform } from "@prisma/client";

interface CFSubmission {
  id: number;
  creationTimeSeconds: number;
  verdict: string;
  problem: { name: string; contestId?: number; index?: string };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cfProfile = await prisma.platformProfile.findUnique({
    where: {
      userId_platform: {
        userId: session.user.id,
        platform: Platform.CODEFORCES,
      },
    },
  });

  if (!cfProfile) {
    return NextResponse.json({ activity: [], streak: 0, longestStreak: 0 });
  }

  const res = await fetch(
    `https://codeforces.com/api/user.status?handle=${cfProfile.username}&from=1&count=10000`,
    { next: { revalidate: 0 } }
  );

  if (!res.ok) {
    return NextResponse.json({ activity: [], streak: 0, longestStreak: 0 });
  }

  const json = await res.json();
  if (json.status !== "OK") {
    return NextResponse.json({ activity: [], streak: 0, longestStreak: 0 });
  }

  const submissions = json.result as CFSubmission[];
  const accepted = submissions.filter((s) => s.verdict === "OK");

  const countByDate: Record<string, number> = {};
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  for (const sub of accepted) {
    const date = new Date(sub.creationTimeSeconds * 1000);
    if (date < oneYearAgo) continue;
    const key = date.toISOString().slice(0, 10);
    countByDate[key] = (countByDate[key] ?? 0) + 1;
  }

  const activity = Object.entries(countByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const allDates = new Set(activity.map((a) => a.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = now.toISOString().slice(0, 10);
  const d = new Date(today);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (allDates.has(key)) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedDates = [...allDates].sort();
  for (const dateStr of sortedDates) {
    const prev = new Date(dateStr);
    prev.setDate(prev.getDate() - 1);
    const prevKey = prev.toISOString().slice(0, 10);
    if (allDates.has(prevKey)) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return NextResponse.json({
    activity,
    streak: currentStreak,
    longestStreak,
  });
}
