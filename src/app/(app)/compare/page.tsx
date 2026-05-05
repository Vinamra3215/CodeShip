"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import RadarCompareChart from "@/components/comparison/RadarCompareChart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const USER_COLORS = ["text-indigo-400", "text-orange-400", "text-emerald-400", "text-pink-400"];
const USER_BG = ["bg-indigo-500/10 border-indigo-500/30", "bg-orange-500/10 border-orange-500/30", "bg-emerald-500/10 border-emerald-500/30", "bg-pink-500/10 border-pink-500/30"];

interface CompareUser {
  handle: string;
  name: string;
  college: string;
  isRegistered: boolean;
  cfRating: number;
  cfMaxRating: number;
  cfRank: string;
  lcEasy: number;
  lcMedium: number;
  lcHard: number;
  lcTotal: number;
  ccRating: number;
  ccStars: string;
  gfgScore: number;
  gfgSolved: number;
  totalSolved: number;
}

function WinnerHighlight({ values, idx }: { values: number[]; idx: number }) {
  const max = Math.max(...values);
  const isWinner = values[idx] === max && max > 0;
  return isWinner ? (
    <span className="ml-1 text-xs text-emerald-400">▲</span>
  ) : null;
}

function MetricRow({
  label,
  values,
  fmt = (v: number) => (v > 0 ? String(v) : "—"),
}: {
  label: string;
  values: number[];
  fmt?: (v: number) => string;
}) {
  return (
    <tr className="border-b border-zinc-800/50">
      <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </td>
      {values.map((v, i) => {
        const max = Math.max(...values);
        const isWinner = v === max && max > 0;
        return (
          <td
            key={i}
            className={`px-4 py-3 font-mono text-sm font-semibold ${
              isWinner ? USER_COLORS[i] : "text-white"
            }`}
          >
            {fmt(v)}
            {isWinner && values.filter((x) => x === max).length === 1 && (
              <span className="ml-1 text-xs">★</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const initialHandles = searchParams.get("handles") ?? "";

  const [inputValue, setInputValue] = useState(initialHandles);
  const [queryHandles, setQueryHandles] = useState(initialHandles);

  const apiUrl = queryHandles
    ? `/api/compare?handles=${encodeURIComponent(queryHandles)}`
    : null;

  const { data, isLoading } = useSWR<{ users: CompareUser[] }>(apiUrl, fetcher);
  const users = data?.users ?? [];

  const handleSearch = useCallback(() => {
    setQueryHandles(inputValue.trim());
  }, [inputValue]);

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Link href="/leaderboard" className="text-sm text-zinc-500 hover:text-white">
              ← Leaderboard
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">Head-to-Head Compare</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Compare up to 4 Codeforces handles side by side. Registered Codeship users show full multi-platform stats.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="tourist, Um_nik, Benq, jiangly (comma-separated)"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={!inputValue.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            Compare
          </button>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-zinc-800" />
            ))}
          </div>
        )}

        {!isLoading && users.length > 0 && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {users.map((u, i) => (
                <div
                  key={u.handle}
                  className={`rounded-xl border p-4 ${USER_BG[i % USER_BG.length]}`}
                >
                  <p className={`text-lg font-bold ${USER_COLORS[i % USER_COLORS.length]}`}>
                    {u.handle}
                  </p>
                  {u.isRegistered && (
                    <p className="text-sm text-white">{u.name}</p>
                  )}
                  <p className="text-xs text-zinc-500">{u.college}</p>
                  {u.isRegistered && (
                    <span className="mt-1 inline-block rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400">
                      Codeship
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-8 overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Metric
                    </th>
                    {users.map((u, i) => (
                      <th
                        key={u.handle}
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${USER_COLORS[i % USER_COLORS.length]}`}
                      >
                        {u.handle}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <MetricRow label="CF Rating" values={users.map((u) => u.cfRating)} />
                  <MetricRow label="CF Max Rating" values={users.map((u) => u.cfMaxRating)} />
                  <MetricRow label="LC Easy" values={users.map((u) => u.lcEasy)} />
                  <MetricRow label="LC Medium" values={users.map((u) => u.lcMedium)} />
                  <MetricRow label="LC Hard" values={users.map((u) => u.lcHard)} />
                  <MetricRow label="LC Total" values={users.map((u) => u.lcTotal)} />
                  <MetricRow label="CC Rating" values={users.map((u) => u.ccRating)} />
                  <MetricRow
                    label="CC Stars"
                    values={users.map((u) => parseInt(u.ccStars) || 0)}
                    fmt={(v) => (v > 0 ? `${v}★` : "—")}
                  />
                  <MetricRow label="GFG Score" values={users.map((u) => u.gfgScore)} />
                  <MetricRow label="GFG Solved" values={users.map((u) => u.gfgSolved)} />
                  <MetricRow
                    label="Total Solved"
                    values={users.map((u) => u.totalSolved)}
                  />
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Radar Overview (normalized 0–100)
              </h3>
              <RadarCompareChart
                users={users.map((u) => ({
                  handle: u.handle,
                  cfRating: u.cfRating,
                  lcTotal: u.lcTotal,
                  gfgScore: u.gfgScore,
                  totalSolved: u.totalSolved,
                  lcHard: u.lcHard,
                }))}
              />
            </div>
          </>
        )}

        {!isLoading && queryHandles && users.length === 0 && (
          <div className="py-16 text-center text-zinc-500">
            No users found for those handles.
          </div>
        )}
      </div>
    </main>
  );
}
