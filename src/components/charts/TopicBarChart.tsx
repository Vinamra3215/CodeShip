"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface TopicStat {
  topicName: string;
  problemsCount: number;
}

const COLORS = [
  "#818cf8", "#a78bfa", "#c084fc", "#e879f9",
  "#f472b6", "#fb7185", "#f87171", "#fb923c",
  "#fbbf24", "#a3e635", "#34d399", "#2dd4bf",
  "#22d3ee", "#38bdf8", "#60a5fa", "#818cf8",
];

export default function TopicBarChart({ data }: { data: TopicStat[] }) {
  const top15 = data.slice(0, 15);

  if (top15.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No topic data yet. Sync your profile first.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={top15}
        layout="vertical"
        margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
      >
        <XAxis type="number" tick={{ fill: "#71717a", fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="topicName"
          width={110}
          tick={{ fill: "#a1a1aa", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
          }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="problemsCount" radius={[0, 6, 6, 0]} barSize={20}>
          {top15.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
