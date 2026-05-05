"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RatingPoint {
  platform: string;
  date: string;
  rating: number;
  contestName: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  Codeforces: "#818cf8",
  LeetCode: "#fb923c",
  CodeChef: "#fbbf24",
};

type Range = "3m" | "6m" | "1y" | "all";

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

export default function MultiPlatformRatingChart({
  data,
}: {
  data: RatingPoint[];
}) {
  const [range, setRange] = useState<Range>("all");

  const platforms = useMemo(
    () => [...new Set(data.map((d) => d.platform))],
    [data]
  );

  const filteredData = useMemo(() => {
    if (range === "all") return data;
    const now = new Date();
    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
    const cutoff = subtractMonths(now, months).toISOString().slice(0, 10);
    return data.filter((d) => d.date >= cutoff);
  }, [data, range]);

  const chartData = useMemo(() => {
    const allDates = [...new Set(filteredData.map((d) => d.date))].sort();
    return allDates.map((date) => {
      const row: Record<string, string | number | null> = { date };
      for (const p of platforms) {
        const point = filteredData.find(
          (d) => d.date === date && d.platform === p
        );
        row[p] = point?.rating ?? null;
        if (point) {
          row[`${p}_contest`] = point.contestName;
        }
      }
      return row;
    });
  }, [filteredData, platforms]);

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-zinc-500">
        No contest history found. Sync your platforms first.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["3m", "6m", "1y", "all"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              range === r
                ? "bg-indigo-600 text-white"
                : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {r === "all" ? "All Time" : r.toUpperCase()}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            stroke="#52525b"
            fontSize={11}
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return `${d.toLocaleString("default", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
            }}
          />
          <YAxis stroke="#52525b" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value: unknown, name: unknown, entry: unknown) => {
              const v = value as number;
              const n = name as string;
              const e = entry as { payload: Record<string, unknown> };
              const contest = e.payload[`${n}_contest`] ?? "";
              return [`${v}${contest ? ` — ${contest}` : ""}`, n];
            }}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: PLATFORM_COLORS[value] ?? "#a1a1aa", fontSize: 12 }}>
                {value}
              </span>
            )}
          />
          {platforms.map((p) => (
            <Line
              key={p}
              type="monotone"
              dataKey={p}
              stroke={PLATFORM_COLORS[p] ?? "#a1a1aa"}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
