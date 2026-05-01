"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DiffEntry {
  platform: string;
  Easy: number;
  Medium: number;
  Hard: number;
  School?: number;
  Basic?: number;
}

export default function DifficultyBreakdownChart({
  data,
}: {
  data: DiffEntry[];
}) {
  const nonEmpty = data.filter(
    (d) => d.Easy > 0 || d.Medium > 0 || d.Hard > 0
  );

  if (nonEmpty.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
        Sync LeetCode or GFG to see difficulty breakdown.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={nonEmpty}
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        barSize={32}
        barGap={6}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="platform"
          tick={{ fill: "#a1a1aa", fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
          }}
          cursor={{ fill: "#27272a" }}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "#a1a1aa", fontSize: 12 }}>{value}</span>
          )}
        />
        <Bar dataKey="Easy" name="Easy" fill="#34d399" radius={[4, 4, 0, 0]} stackId="a" />
        <Bar dataKey="Medium" name="Medium" fill="#fbbf24" radius={[4, 4, 0, 0]} stackId="a" />
        <Bar dataKey="Hard" name="Hard" fill="#f87171" radius={[4, 4, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
