"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LeaderboardEntry {
  rank: number;
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
}

type SortKey = "composite" | "cf_rating" | "lc_problems" | "total_problems" | "gfg_score";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Composite Score", value: "composite" },
  { label: "CF Rating", value: "cf_rating" },
  { label: "LC Problems", value: "lc_problems" },
  { label: "Total Solved", value: "total_problems" },
  { label: "GFG Score", value: "gfg_score" },
];

function getRatingColor(rating: number): string {
  if (rating >= 2400) return "text-red-400";
  if (rating >= 2100) return "text-orange-400";
  if (rating >= 1900) return "text-violet-400";
  if (rating >= 1600) return "text-blue-400";
  if (rating >= 1400) return "text-cyan-400";
  if (rating >= 1200) return "text-green-400";
  return "text-zinc-400";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm text-zinc-500">#{rank}</span>;
}

function TypeBadge({ type }: { type: LeaderboardEntry["type"] }) {
  if (type === "registered")
    return (
      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
        Codeship
      </span>
    );
  if (type === "watched")
    return (
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
        Watched
      </span>
    );
  return (
    <span className="rounded-full bg-zinc-700/40 px-2 py-0.5 text-xs font-medium text-zinc-400">
      IITJ
    </span>
  );
}

export default function LeaderboardPage() {
  const [sort, setSort] = useState<SortKey>("composite");
  const [page, setPage] = useState(1);
  const [watchInput, setWatchInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [search, setSearch] = useState("");

  const { data, mutate, isLoading } = useSWR<{
    entries: LeaderboardEntry[];
    total: number;
    totalPages: number;
  }>(`/api/leaderboard?sort=${sort}&page=${page}`, fetcher);

  const { data: discoverData, mutate: mutateDiscover } = useSWR<{ total: number }>(
    "/api/discover/codeforces",
    fetcher
  );

  const handleAddWatch = useCallback(async () => {
    const handle = watchInput.trim();
    if (!handle) return;
    setAdding(true);
    try {
      const res = await fetch("/api/watch/codeforces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cfHandle: handle }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to add handle");
      } else {
        toast.success(`Watching ${handle}`);
        setWatchInput("");
        mutate();
      }
    } catch {
      toast.error("Network error");
    }
    setAdding(false);
  }, [watchInput, mutate]);

  const handleRemoveWatch = useCallback(
    async (cfHandle: string) => {
      await fetch("/api/watch/codeforces", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cfHandle }),
      });
      toast.success(`Removed ${cfHandle}`);
      mutate();
    },
    [mutate]
  );

  const handleDiscover = useCallback(async () => {
    setDiscovering(true);
    toast.loading("Scanning CF for IITJ users… (this takes ~30s)", { id: "discover" });
    try {
      const res = await fetch("/api/discover/codeforces", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast.success(`Found ${json.discovered} IITJ users on Codeforces!`, { id: "discover" });
        mutate();
        mutateDiscover();
      } else {
        toast.error(json.error ?? "Discovery failed", { id: "discover" });
      }
    } catch {
      toast.error("Network error", { id: "discover" });
    }
    setDiscovering(false);
  }, [mutate, mutateDiscover]);

  const filtered = (data?.entries ?? []).filter(
    (e) =>
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.cfHandle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              IIT Jodhpur competitive programmers — registered &amp; discovered from Codeforces.
              {discoverData?.total ? (
                <span className="ml-1 text-zinc-500">
                  ({discoverData.total} IITJ CF users indexed)
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDiscover}
              disabled={discovering}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
            >
              {discovering ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Scanning…
                </>
              ) : (
                "🔍 Refresh IITJ Discovery"
              )}
            </button>
            <Link
              href="/compare"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              ⚔️ Compare
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Watch a CF Handle (private — only visible to you)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={watchInput}
              onChange={(e) => setWatchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWatch()}
              placeholder="e.g. tourist"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleAddWatch}
              disabled={adding || !watchInput.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {adding ? "Adding…" : "Watch"}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or handle…"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  setSort(o.value);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  sort === o.value
                    ? "bg-indigo-600 text-white"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Rank</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">CF Rating</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">LC Solved</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">CC Stars</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">GFG Score</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Total</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Score</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-zinc-800" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-zinc-500">
                    No users found. Click &quot;Refresh IITJ Discovery&quot; to scan Codeforces.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-zinc-800/50 transition hover:bg-zinc-800/30 ${
                      entry.isCurrentUser ? "bg-indigo-900/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-medium ${entry.isCurrentUser ? "text-indigo-400" : "text-white"}`}>
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="ml-1 text-xs text-indigo-500">(you)</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {entry.cfHandle && (
                            <a
                              href={`https://codeforces.com/profile/${entry.cfHandle}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-zinc-500 hover:text-zinc-300"
                            >
                              {entry.cfHandle}
                            </a>
                          )}
                          <TypeBadge type={entry.type} />
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 font-mono font-semibold ${getRatingColor(entry.cfRating)}`}>
                      {entry.cfRating > 0 ? entry.cfRating : "—"}
                      {entry.cfRank && (
                        <div className="text-xs font-normal text-zinc-500">{entry.cfRank}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-orange-400">
                      {entry.lcSolved > 0 ? entry.lcSolved : "—"}
                    </td>
                    <td className="px-4 py-3 text-amber-400">
                      {entry.ccStars || "—"}
                    </td>
                    <td className="px-4 py-3 text-green-400">
                      {entry.gfgScore > 0 ? entry.gfgScore : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {entry.totalSolved > 0 ? entry.totalSolved : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-violet-400">
                      {entry.compositeScore > 0 ? entry.compositeScore : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/compare?handles=${entry.cfHandle}`}
                          className="text-xs text-zinc-500 hover:text-white"
                        >
                          Compare
                        </Link>
                        {entry.type === "watched" && (
                          <button
                            onClick={() => handleRemoveWatch(entry.cfHandle)}
                            className="text-xs text-red-500 hover:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
            <span>
              {data.total} total users · Page {page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-xs hover:text-white disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-xs hover:text-white disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
