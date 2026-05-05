"use client";

const MILESTONES = [7, 30, 100, 365];

export default function StreakCard({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number;
  longestStreak: number;
}) {
  const nextMilestone =
    MILESTONES.find((m) => m > currentStreak) ?? currentStreak + 50;
  const progress = Math.min(100, Math.round((currentStreak / nextMilestone) * 100));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Current Streak
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-orange-400">
              {currentStreak}
            </span>
            <span className="text-lg">🔥</span>
            <span className="text-sm text-zinc-500">
              day{currentStreak !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Longest
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-300">
            {longestStreak}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Progress to {nextMilestone}-day milestone</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
