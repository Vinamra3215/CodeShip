"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ContestEntry {
  contestName: string;
  ratingAfter: number;
  rank: number;
  date: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export default function RatingLineChart({ data }: { data: ContestEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No contest history yet.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  const maxRating = Math.max(...data.map((d) => d.ratingAfter));
  const minRating = Math.min(...data.map((d) => d.ratingAfter));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717a", fontSize: 11 }}
          interval="equidistantPreserveStart"
        />
        <YAxis
          domain={[Math.max(0, minRating - 200), maxRating + 200]}
          tick={{ fill: "#71717a", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            color: "#fff",
            fontSize: 13,
          }}
          labelFormatter={(_, payload) => {
            if (payload?.[0]?.payload?.contestName) {
              return payload[0].payload.contestName;
            }
            return "";
          }}
          formatter={(value: unknown, _name: unknown, props: unknown) => {
            const entry = (props as { payload: ContestEntry }).payload;
            return [`Rating: ${value}  |  Rank: #${entry.rank}`, ""];
          }}
        />
        <ReferenceLine y={1200} stroke="#3f3f46" strokeDasharray="3 3" />
        <ReferenceLine y={1400} stroke="#3f3f46" strokeDasharray="3 3" />
        <ReferenceLine y={1600} stroke="#3f3f46" strokeDasharray="3 3" />
        <ReferenceLine y={1900} stroke="#3f3f46" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="ratingAfter"
          stroke="#818cf8"
          strokeWidth={2}
          dot={{ r: 2, fill: "#818cf8" }}
          activeDot={{ r: 5, fill: "#a78bfa", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
