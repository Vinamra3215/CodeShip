import { Platform } from "@prisma/client";

const STALENESS_THRESHOLDS: Record<Platform, number> = {
  CODEFORCES: 30 * 60 * 1000,
  LEETCODE: 60 * 60 * 1000,
  CODECHEF: 2 * 60 * 60 * 1000,
  GFG: 6 * 60 * 60 * 1000,
};

export function isStale(
  lastFetched: Date | null,
  platform: Platform
): boolean {
  if (!lastFetched) return true;
  const elapsed = Date.now() - lastFetched.getTime();
  return elapsed > STALENESS_THRESHOLDS[platform];
}

export function getThresholdLabel(platform: Platform): string {
  const ms = STALENESS_THRESHOLDS[platform];
  const minutes = ms / 60000;
  if (minutes < 60) return `${minutes} min`;
  return `${minutes / 60} hr`;
}
