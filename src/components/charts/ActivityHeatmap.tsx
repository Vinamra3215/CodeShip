"use client";

import { useMemo } from "react";

interface ActivityDay {
  date: string;
  count: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];

function getColor(count: number): string {
  if (count === 0) return "#18181b";
  if (count <= 1) return "#064e3b";
  if (count <= 3) return "#047857";
  if (count <= 5) return "#10b981";
  return "#34d399";
}

export default function ActivityHeatmap({
  data,
}: {
  data: ActivityDay[];
}) {
  const { grid, monthLabels } = useMemo(() => {
    const countMap = new Map(data.map((d) => [d.date, d.count]));
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);

    const startDay = startDate.getDay();
    const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
    const labels: { week: number; label: string }[] = [];
    let lastMonth = -1;

    const d = new Date(startDate);
    let weekIndex = 0;

    while (d <= today) {
      const key = d.toISOString().slice(0, 10);
      const dow = d.getDay();
      const month = d.getMonth();

      if (dow === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      if (month !== lastMonth) {
        labels.push({ week: weekIndex, label: MONTHS[month] });
        lastMonth = month;
      }

      currentWeek.push({
        date: key,
        count: countMap.get(key) ?? 0,
        dayOfWeek: dow,
      });

      d.setDate(d.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { grid: weeks, monthLabels: labels };
  }, [data]);

  const cellSize = 12;
  const gap = 2;
  const labelWidth = 28;
  const headerHeight = 18;
  const totalWidth = labelWidth + grid.length * (cellSize + gap);
  const totalHeight = headerHeight + 7 * (cellSize + gap);

  return (
    <div className="overflow-x-auto">
      <svg width={totalWidth} height={totalHeight} className="block">
        {monthLabels.map((m, i) => (
          <text
            key={i}
            x={labelWidth + m.week * (cellSize + gap)}
            y={12}
            fill="#71717a"
            fontSize={10}
            fontFamily="system-ui"
          >
            {m.label}
          </text>
        ))}

        {DAYS.map((label, i) => (
          <text
            key={i}
            x={0}
            y={headerHeight + i * (cellSize + gap) + cellSize - 2}
            fill="#52525b"
            fontSize={9}
            fontFamily="system-ui"
          >
            {label}
          </text>
        ))}

        {grid.map((week, wi) =>
          week.map((day) => (
            <g key={day.date}>
              <rect
                x={labelWidth + wi * (cellSize + gap)}
                y={headerHeight + day.dayOfWeek * (cellSize + gap)}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={getColor(day.count)}
                className="transition-colors"
              >
                <title>
                  {day.count > 0
                    ? `${day.count} problem${day.count > 1 ? "s" : ""} on ${day.date}`
                    : `No activity on ${day.date}`}
                </title>
              </rect>
            </g>
          ))
        )}
      </svg>

      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-zinc-500">
        <span>Less</span>
        {[0, 1, 3, 5, 8].map((v, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: getColor(v) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
