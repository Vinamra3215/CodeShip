"use client";

import useSWR from "swr";
import Link from "next/link";
import TopicBarChart from "@/components/charts/TopicBarChart";
import RatingLineChart from "@/components/charts/RatingLineChart";
import PlatformDonutChart from "@/components/charts/PlatformDonutChart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TopicStat {
  topicName: string;
  problemsCount: number;
}

interface ContestEntry {
  contestName: string;
  ratingAfter: number;
  rank: number;
  date: string;
}

interface PlatformData {
  username: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  problemsSolved: number;
  lastFetched: string | null;
  rawData: Record<string, unknown> | null;
  topicStats: TopicStat[];
  contestHistory: ContestEntry[];
}

interface DashboardData {
  name: string;
  platforms: Record<string, PlatformData>;
}

function getRankColor(rank: string | null): string {
  if (!rank) return "text-zinc-400";
  const r = rank.toLowerCase();
  if (r.includes("legendary") || r.includes("tourist")) return "text-red-400";
  if (r.includes("international grandmaster")) return "text-red-500";
  if (r.includes("grandmaster")) return "text-red-400";
  if (r.includes("international master")) return "text-orange-400";
  if (r.includes("master")) return "text-orange-300";
  if (r.includes("candidate master")) return "text-violet-400";
  if (r.includes("expert")) return "text-blue-400";
  if (r.includes("specialist")) return "text-cyan-400";
  if (r.includes("pupil")) return "text-green-400";
  return "text-zinc-400";
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
    </div>
  );
}

function SectionHeader({
  color,
  label,
  username,
}: {
  color: string;
  label: string;
  username: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <h2 className="text-lg font-semibold text-white">{label}</h2>
      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
        @{username}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR<DashboardData>(
    "/api/dashboard",
    fetcher
  );

  if (isLoading) {
    return (
      <main className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-zinc-800" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-zinc-800" />
              ))}
            </div>
            <div className="h-72 rounded-xl bg-zinc-800" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-10">
        <div className="mx-auto max-w-6xl text-center text-red-400">
          Failed to load dashboard data.
        </div>
      </main>
    );
  }

  const cf = data?.platforms?.CODEFORCES as PlatformData | undefined;
  const lc = data?.platforms?.LEETCODE as PlatformData | undefined;
  const cc = data?.platforms?.CODECHEF as PlatformData | undefined;
  const gfg = data?.platforms?.GFG as PlatformData | undefined;

  const hasAnyPlatform = cf || lc || cc || gfg;

  const gfgRaw = gfg?.rawData as {
    codingScore?: number;
    institute?: string;
    instituteRank?: number;
    school?: number;
    basic?: number;
    easy?: number;
    medium?: number;
    hard?: number;
    currentStreak?: number;
    maxStreak?: number;
  } | null;

  const ccRaw = cc?.rawData as {
    currentRating?: number;
    highestRating?: number;
    globalRank?: number;
    countryRank?: number;
    stars?: string;
  } | null;

  const bestCFRank = cf?.contestHistory?.length
    ? Math.min(...cf.contestHistory.map((c) => c.rank))
    : null;

  const lcRaw = lc?.rawData as {
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
    ranking?: number;
    contestRating?: number;
    topPercentage?: number;
  } | null;

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {data?.name} 👋
          </h1>
          <p className="mt-2 text-zinc-400">
            Your competitive programming stats at a glance.
          </p>
        </div>

        {!hasAnyPlatform ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
            <p className="text-lg font-medium text-zinc-300">
              No platforms connected yet
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Head to{" "}
              <Link
                href="/settings"
                className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300"
              >
                Settings
              </Link>{" "}
              to add your Codeforces or LeetCode handle, then sync your data.
            </p>
          </div>
        ) : (
          <div className="space-y-14">

            {hasAnyPlatform && (
              <section>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Problems Solved</p>
                    <p className="mt-2 text-5xl font-bold text-white">
                      {(
                        (cf?.problemsSolved ?? 0) +
                        (lc?.problemsSolved ?? 0) +
                        (cc?.problemsSolved ?? 0) +
                        (gfg?.problemsSolved ?? 0)
                      ).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">across all connected platforms</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">By Platform</p>
                    <PlatformDonutChart
                      data={[
                        { platform: "Codeforces", solved: cf?.problemsSolved ?? 0 },
                        { platform: "LeetCode", solved: lc?.problemsSolved ?? 0 },
                        { platform: "CodeChef", solved: cc?.problemsSolved ?? 0 },
                        { platform: "GeeksforGeeks", solved: gfg?.problemsSolved ?? 0 },
                      ]}
                    />
                  </div>
                </div>
              </section>
            )}

            {cf && (
              <section>
                <SectionHeader
                  color="bg-blue-500"
                  label="Codeforces"
                  username={cf.username}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Current Rating"
                    value={cf.rating ?? "—"}
                    sub={cf.rank ?? undefined}
                    accent={getRankColor(cf.rank)}
                  />
                  <StatCard label="Max Rating" value={cf.maxRating ?? "—"} />
                  <StatCard
                    label="Problems Solved"
                    value={cf.problemsSolved}
                    accent="text-emerald-400"
                  />
                  <StatCard
                    label="Best Contest Rank"
                    value={bestCFRank ? `#${bestCFRank}` : "—"}
                    accent="text-amber-400"
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                      Rating History
                    </h3>
                    <RatingLineChart data={cf.contestHistory} />
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                      Topics Solved
                    </h3>
                    <TopicBarChart data={cf.topicStats} />
                  </div>
                </div>

                {cf.contestHistory.length > 0 && (
                  <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                      Recent Contests
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                            <th className="pb-3 pr-4">Contest</th>
                            <th className="pb-3 pr-4">Rank</th>
                            <th className="pb-3 pr-4">Rating</th>
                            <th className="pb-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cf.contestHistory
                            .slice(-10)
                            .reverse()
                            .map((c, i) => (
                              <tr
                                key={i}
                                className="border-b border-zinc-800/50 text-zinc-300"
                              >
                                <td className="py-2.5 pr-4 font-medium">
                                  {c.contestName}
                                </td>
                                <td className="py-2.5 pr-4">#{c.rank}</td>
                                <td className="py-2.5 pr-4">{c.ratingAfter}</td>
                                <td className="py-2.5 text-zinc-500">
                                  {new Date(c.date).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {lc && (
              <section>
                <SectionHeader
                  color="bg-orange-500"
                  label="LeetCode"
                  username={lc.username}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Easy Solved"
                    value={lcRaw?.easySolved ?? lc.problemsSolved}
                    accent="text-emerald-400"
                  />
                  <StatCard
                    label="Medium Solved"
                    value={lcRaw?.mediumSolved ?? "—"}
                    accent="text-amber-400"
                  />
                  <StatCard
                    label="Hard Solved"
                    value={lcRaw?.hardSolved ?? "—"}
                    accent="text-red-400"
                  />
                  <StatCard
                    label="Global Rank"
                    value={lcRaw?.ranking ? `#${lcRaw.ranking.toLocaleString()}` : "—"}
                    sub={
                      lcRaw?.contestRating
                        ? `Contest rating: ${Math.round(lcRaw.contestRating)}`
                        : undefined
                    }
                    accent="text-orange-400"
                  />
                </div>

                {lc.topicStats.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                        Topics Solved
                      </h3>
                      <TopicBarChart data={lc.topicStats} />
                    </div>

                    {lc.contestHistory.length > 0 && (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                          Contest History
                        </h3>
                        <RatingLineChart data={lc.contestHistory} />
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {cc && (
              <section>
                <SectionHeader
                  color="bg-amber-500"
                  label="CodeChef"
                  username={cc.username}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Rating"
                    value={ccRaw?.currentRating ?? cc.rating ?? "—"}
                    sub={ccRaw?.stars ?? cc.rank ?? undefined}
                    accent="text-amber-400"
                  />
                  <StatCard
                    label="Highest Rating"
                    value={ccRaw?.highestRating ?? cc.maxRating ?? "—"}
                  />
                  <StatCard
                    label="Global Rank"
                    value={ccRaw?.globalRank ? `#${ccRaw.globalRank.toLocaleString()}` : "—"}
                    accent="text-emerald-400"
                  />
                  <StatCard
                    label="Problems Solved"
                    value={cc.problemsSolved}
                    sub={ccRaw?.countryRank ? `Country rank: #${ccRaw.countryRank.toLocaleString()}` : undefined}
                  />
                </div>
              </section>
            )}

            {gfg && (
              <section>
                <SectionHeader
                  color="bg-green-500"
                  label="GeeksforGeeks"
                  username={gfg.username}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Coding Score"
                    value={gfgRaw?.codingScore ?? gfg.rating ?? "—"}
                    sub={gfgRaw?.institute || undefined}
                    accent="text-green-400"
                  />
                  <StatCard
                    label="Total Solved"
                    value={gfg.problemsSolved}
                    sub={
                      gfgRaw?.instituteRank
                        ? `Institute rank: #${gfgRaw.instituteRank}`
                        : undefined
                    }
                  />
                  <StatCard
                    label="Easy + Medium"
                    value={
                      (gfgRaw?.easy ?? 0) + (gfgRaw?.medium ?? 0)
                    }
                    sub={`Easy: ${gfgRaw?.easy ?? 0}  ·  Medium: ${gfgRaw?.medium ?? 0}`}
                    accent="text-emerald-400"
                  />
                  <StatCard
                    label="Hard"
                    value={gfgRaw?.hard ?? "—"}
                    sub={
                      gfgRaw?.currentStreak
                        ? `Streak: ${gfgRaw.currentStreak} days`
                        : undefined
                    }
                    accent="text-red-400"
                  />
                </div>

                {gfg.topicStats.length > 0 && (
                  <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                      Difficulty Breakdown
                    </h3>
                    <TopicBarChart data={gfg.topicStats} />
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
