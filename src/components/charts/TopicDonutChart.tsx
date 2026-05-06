"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopicEntry {
  topicName: string;
  count: number;
  platforms: { name: string; count: number }[];
}

const COLORS = [
  "#818cf8", "#fb923c", "#34d399", "#f472b6", "#fbbf24",
  "#38bdf8", "#a78bfa", "#f87171", "#4ade80", "#e879f9",
  "#22d3ee", "#facc15", "#fb7185", "#2dd4bf", "#c084fc",
];

export default function TopicDonutChart({ data }: { data: TopicEntry[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const top15 = useMemo(() => data.slice(0, 15), [data]);

  if (top15.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-zinc-500">
        No topic data available.
      </div>
    );
  }

  const selected = selectedIdx !== null ? top15[selectedIdx] : null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={top15}
            cx="50%" cy="50%"
            innerRadius={70} outerRadius={110}
            dataKey="count"
            nameKey="topicName"
            onClick={(_, index) => setSelectedIdx(index)}
            style={{ cursor: "pointer" }}
          >
            {top15.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                stroke={selectedIdx === i ? "#fff" : "transparent"}
                strokeWidth={selectedIdx === i ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: unknown, name: unknown) => [`${value} problems`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>

      {selected && selected.platforms.length > 0 && (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {selected.topicName} — by platform
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {selected.platforms.map((p) => (
              <span key={p.name} className="text-sm text-white">
                <span className="text-zinc-500">{p.name}:</span>{" "}
                <span className="font-semibold">{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
