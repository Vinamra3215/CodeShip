"use client";

import {
  RadarChart as RechartsRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const USER_COLORS = ["#818cf8", "#fb923c", "#34d399", "#f472b6"];

interface UserStats {
  handle: string;
  cfRating: number;
  lcTotal: number;
  gfgScore: number;
  totalSolved: number;
  lcHard: number;
}

function normalize(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}

export default function RadarCompareChart({ users }: { users: UserStats[] }) {
  const maxCF = Math.max(...users.map((u) => u.cfRating), 1);
  const maxLC = Math.max(...users.map((u) => u.lcTotal), 1);
  const maxGFG = Math.max(...users.map((u) => u.gfgScore), 1);
  const maxTotal = Math.max(...users.map((u) => u.totalSolved), 1);
  const maxHard = Math.max(...users.map((u) => u.lcHard), 1);

  const axes = [
    { key: "CF Rating", fn: (u: UserStats) => normalize(u.cfRating, maxCF) },
    { key: "Volume", fn: (u: UserStats) => normalize(u.totalSolved, maxTotal) },
    { key: "LC Hard", fn: (u: UserStats) => normalize(u.lcHard, maxHard) },
    { key: "GFG Score", fn: (u: UserStats) => normalize(u.gfgScore, maxGFG) },
    { key: "LC Problems", fn: (u: UserStats) => normalize(u.lcTotal, maxLC) },
  ];

  const data = axes.map((axis) => {
    const row: Record<string, string | number> = { axis: axis.key };
    users.forEach((u) => {
      row[u.handle] = axis.fn(u);
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="#27272a" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#a1a1aa", fontSize: 12 }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {users.map((u, i) => (
          <Radar
            key={u.handle}
            name={u.handle}
            dataKey={u.handle}
            stroke={USER_COLORS[i % USER_COLORS.length]}
            fill={USER_COLORS[i % USER_COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            color: "#fff",
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "#a1a1aa", fontSize: 12 }}>{value}</span>
          )}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
