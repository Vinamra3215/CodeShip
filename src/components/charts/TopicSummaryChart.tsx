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
  Cell,
} from "recharts";

interface TopicRow {
  topic: string;
  total: number;
  CF: number;
  LC: number;
}

interface Platform {
  name: "CODEFORCES" | "LEETCODE";
  topicStats: Array<{ topicName: string; problemsCount: number }>;
}

export default function TopicSummaryChart({
  platforms,
}: {
  platforms: Platform[];
}) {
  const merged: Record<string, TopicRow> = {};

  for (const platform of platforms) {
    const key = platform.name === "CODEFORCES" ? "CF" : "LC";
    for (const stat of platform.topicStats) {
      if (!merged[stat.topicName]) {
        merged[stat.topicName] = { topic: stat.topicName, total: 0, CF: 0, LC: 0 };
      }
      merged[stat.topicName][key] += stat.problemsCount;
      merged[stat.topicName].total += stat.problemsCount;
    }
  }

  const top10 = Object.values(merged)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .reverse();

  if (top10.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        Sync Codeforces or LeetCode to see topic stats.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={top10.length * 40 + 40}>
      <BarChart
        data={top10}
        layout="vertical"
        margin={{ top: 0, right: 24, left: 120, bottom: 0 }}
        barSize={10}
        barGap={3}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="topic"
          tick={{ fill: "#a1a1aa", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={115}
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
            <span style={{ color: "#a1a1aa", fontSize: 12 }}>
              {value === "CF" ? "Codeforces" : "LeetCode"}
            </span>
          )}
        />
        <Bar dataKey="CF" name="CF" fill="#818cf8" radius={[0, 4, 4, 0]}>
          {top10.map((_, i) => (
            <Cell key={i} fill="#818cf8" />
          ))}
        </Bar>
        <Bar dataKey="LC" name="LC" fill="#fb923c" radius={[0, 4, 4, 0]}>
          {top10.map((_, i) => (
            <Cell key={i} fill="#fb923c" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
