"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PlatformEntry {
  name: string;
  value: number;
  color: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  Codeforces: "#818cf8",
  LeetCode: "#fb923c",
  CodeChef: "#fbbf24",
  GeeksforGeeks: "#34d399",
};

export default function PlatformDonutChart({
  data,
}: {
  data: Array<{ platform: string; solved: number }>;
}) {
  const entries: PlatformEntry[] = data
    .filter((d) => d.solved > 0)
    .map((d) => ({
      name: d.platform,
      value: d.solved,
      color: PLATFORM_COLORS[d.platform] ?? "#71717a",
    }));

  if (entries.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={entries}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {entries.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
          }}
          formatter={
            ((value: number, name: string) => [`${value} solved`, name]) as Parameters<typeof import("recharts").Tooltip>[0]["formatter"] & object
          }
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "#a1a1aa", fontSize: 13 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
