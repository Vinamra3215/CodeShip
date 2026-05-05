"use client";

import useSWR from "swr";
import TopicBarChart from "@/components/charts/TopicBarChart";
import DifficultyBreakdownChart from "@/components/charts/DifficultyBreakdownChart";
import TopicSummaryChart from "@/components/charts/TopicSummaryChart";
import PlatformDonutChart from "@/components/charts/PlatformDonutChart";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import StreakCard from "@/components/StreakCard";
import MultiPlatformRatingChart from "@/components/charts/MultiPlatformRatingChart";
import { Platform } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TopicStat {
  topicName: string;
  problemsCount: number;
}

interface Profile {
  platform: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  problemsSolved: number;
  username: string;
  rawData: Record<string, unknown> | null;
  topicStats: TopicStat[];
}

interface ProfileData {
  name: string;
  profiles: Profile[];
}

function StatMini({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function PlatformMiniCard({
  name,
  color,
  profile,
}: {
  name: string;
  color: string;
  profile: Profile | undefined;
}) {
  if (!profile) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          <h3 className="text-sm font-semibold text-white">{name}</h3>
        </div>
        <p className="mt-3 text-sm text-zinc-500">Not connected</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-white">{name}</h3>
        <span className="ml-auto text-xs text-zinc-500">
          @{profile.username}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {profile.rating != null && profile.rating > 0 && (
          <StatMini label="Rating" value={profile.rating} accent="text-indigo-400" />
        )}
        <StatMini
          label="Solved"
          value={profile.problemsSolved}
          accent="text-emerald-400"
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<ProfileData>("/api/profile", fetcher);
  const { data: activityData } = useSWR<{
    activity: { date: string; count: number }[];
    streak: number;
    longestStreak: number;
  }>("/api/analytics/activity", fetcher);
  const { data: ratingData } = useSWR<{
    history: { platform: string; date: string; rating: number; contestName: string }[];
  }>("/api/analytics/rating-history", fetcher);

  if (isLoading) {
    return (
      <main className="px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      </main>
    );
  }

  const profiles = data?.profiles ?? [];
  const cf = profiles.find((p) => p.platform === Platform.CODEFORCES);
  const lc = profiles.find((p) => p.platform === Platform.LEETCODE);
  const cc = profiles.find((p) => p.platform === Platform.CODECHEF);
  const gfg = profiles.find((p) => p.platform === Platform.GFG);

  const totalSolved =
    (cf?.problemsSolved ?? 0) +
    (lc?.problemsSolved ?? 0) +
    (cc?.problemsSolved ?? 0) +
    (gfg?.problemsSolved ?? 0);

  const connectedPlatforms = profiles.length;
  const cfRating = cf?.rating ?? 0;
  const compositeScore = Math.round(cfRating * 0.3 + totalSolved * 2);

  const lcRaw = lc?.rawData as {
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
  } | null;
  const gfgRaw = gfg?.rawData as {
    easy?: number;
    medium?: number;
    hard?: number;
  } | null;

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Deep dive into your competitive programming performance.
        </p>

        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatMini
              label="Total Solved"
              value={totalSolved.toLocaleString()}
              accent="text-emerald-400"
            />
            <StatMini
              label="Platforms"
              value={connectedPlatforms}
              accent="text-indigo-400"
            />
            <StatMini
              label="CF Rating"
              value={cfRating > 0 ? cfRating : "—"}
              accent="text-cyan-400"
            />
            <StatMini
              label="Composite Score"
              value={compositeScore > 0 ? compositeScore : "—"}
              accent="text-violet-400"
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            By Platform
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PlatformMiniCard name="Codeforces" color="bg-blue-500" profile={cf} />
            <PlatformMiniCard name="LeetCode" color="bg-orange-500" profile={lc} />
            <PlatformMiniCard name="CodeChef" color="bg-amber-500" profile={cc} />
            <PlatformMiniCard name="GeeksforGeeks" color="bg-green-500" profile={gfg} />
          </div>

          {connectedPlatforms > 0 && (
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Platform Distribution
              </h3>
              <PlatformDonutChart
                data={[
                  { platform: "Codeforces", solved: cf?.problemsSolved ?? 0 },
                  { platform: "LeetCode", solved: lc?.problemsSolved ?? 0 },
                  { platform: "CodeChef", solved: cc?.problemsSolved ?? 0 },
                  { platform: "GeeksforGeeks", solved: gfg?.problemsSolved ?? 0 },
                ]}
              />
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            By Topic
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {(cf || lc) && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Top Topics (CF + LC)
                </h3>
                <TopicSummaryChart
                  platforms={[
                    ...(cf ? [{ name: "CODEFORCES" as const, topicStats: cf.topicStats }] : []),
                    ...(lc ? [{ name: "LEETCODE" as const, topicStats: lc.topicStats }] : []),
                  ]}
                />
              </div>
            )}

            {cf && cf.topicStats.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Codeforces Topics
                </h3>
                <TopicBarChart data={cf.topicStats} />
              </div>
            )}

            {lc && lc.topicStats.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  LeetCode Topics
                </h3>
                <TopicBarChart data={lc.topicStats} />
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            By Difficulty
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <DifficultyBreakdownChart
              data={[
                ...(lc && lcRaw
                  ? [{
                      platform: "LeetCode",
                      Easy: lcRaw.easySolved ?? 0,
                      Medium: lcRaw.mediumSolved ?? 0,
                      Hard: lcRaw.hardSolved ?? 0,
                    }]
                  : []),
                ...(gfg && gfgRaw
                  ? [{
                      platform: "GFG",
                      Easy: gfgRaw.easy ?? 0,
                      Medium: gfgRaw.medium ?? 0,
                      Hard: gfgRaw.hard ?? 0,
                    }]
                  : []),
              ]}
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Activity
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Solve Activity (last 365 days)
              </h3>
              <ActivityHeatmap data={activityData?.activity ?? []} />
            </div>
            <StreakCard
              currentStreak={activityData?.streak ?? 0}
              longestStreak={activityData?.longestStreak ?? 0}
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Rating History
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <MultiPlatformRatingChart data={ratingData?.history ?? []} />
          </div>
        </section>
      </div>
    </main>
  );
}
