"use client";

interface MatrixEntry {
  topic: string;
  platforms: Record<string, number>;
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return "bg-zinc-800/30";
  const ratio = count / max;
  if (ratio > 0.7) return "bg-indigo-500/60";
  if (ratio > 0.4) return "bg-indigo-500/35";
  if (ratio > 0.15) return "bg-indigo-500/20";
  return "bg-indigo-500/10";
}

export default function PlatformTopicMatrix({
  data,
  platforms,
}: {
  data: MatrixEntry[];
  platforms: string[];
}) {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-zinc-500">
        No topic data available.
      </div>
    );
  }

  const maxCount = Math.max(
    ...data.flatMap((d) => platforms.map((p) => d.platforms[p] ?? 0)),
    1
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Topic
            </th>
            {platforms.map((p) => (
              <th
                key={p}
                className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {p}
              </th>
            ))}
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const total = platforms.reduce(
              (sum, p) => sum + (row.platforms[p] ?? 0),
              0
            );
            return (
              <tr key={row.topic} className="border-b border-zinc-800/50">
                <td className="px-3 py-2 text-xs font-medium text-zinc-300">
                  {row.topic}
                </td>
                {platforms.map((p) => {
                  const count = row.platforms[p] ?? 0;
                  return (
                    <td key={p} className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex h-7 w-10 items-center justify-center rounded text-xs font-mono font-semibold text-white ${getHeatColor(
                          count,
                          maxCount
                        )}`}
                      >
                        {count > 0 ? count : "·"}
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center text-xs font-bold text-white">
                  {total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
