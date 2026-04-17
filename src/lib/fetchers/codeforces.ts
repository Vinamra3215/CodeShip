import type {
  CFUserInfo,
  CFRatingChange,
  CFSubmission,
  CFTopicStats,
} from "@/types/codeforces";

const CF_API = "https://codeforces.com/api";

class CodeforcesAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "CodeforcesAPIError";
  }
}

async function cfFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${CF_API}${endpoint}`, {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new CodeforcesAPIError(
      `CF API HTTP ${response.status}`,
      response.status
    );
  }

  const data = await response.json();

  if (data.status !== "OK") {
    throw new CodeforcesAPIError(
      data.comment || "Codeforces API returned FAILED status"
    );
  }

  return data.result as T;
}

export async function fetchCFUserInfo(handle: string): Promise<CFUserInfo> {
  const users = await cfFetch<CFUserInfo[]>(
    `/user.info?handles=${encodeURIComponent(handle)}`
  );
  return users[0];
}

export async function fetchCFRatingHistory(
  handle: string
): Promise<CFRatingChange[]> {
  return cfFetch<CFRatingChange[]>(
    `/user.rating?handle=${encodeURIComponent(handle)}`
  );
}

export async function fetchCFSubmissions(
  handle: string
): Promise<CFSubmission[]> {
  return cfFetch<CFSubmission[]>(
    `/user.status?handle=${encodeURIComponent(handle)}`
  );
}

export function extractSolvedProblems(
  submissions: CFSubmission[]
): CFSubmission[] {
  const seen = new Set<string>();
  const solved: CFSubmission[] = [];

  for (const sub of submissions) {
    if (sub.verdict !== "OK") continue;
    const key = `${sub.problem.contestId}-${sub.problem.index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    solved.push(sub);
  }

  return solved;
}

export function computeTopicStats(
  solvedSubmissions: CFSubmission[]
): CFTopicStats {
  const stats: CFTopicStats = {};

  for (const sub of solvedSubmissions) {
    for (const tag of sub.problem.tags) {
      stats[tag] = (stats[tag] || 0) + 1;
    }
  }

  return stats;
}

export function computeDifficultyDistribution(
  solvedSubmissions: CFSubmission[]
): Record<string, number> {
  const dist: Record<string, number> = {};

  for (const sub of solvedSubmissions) {
    const rating = sub.problem.rating;
    if (!rating) {
      dist["Unrated"] = (dist["Unrated"] || 0) + 1;
      continue;
    }
    const bucket = `${Math.floor(rating / 400) * 400}-${Math.floor(rating / 400) * 400 + 399}`;
    dist[bucket] = (dist[bucket] || 0) + 1;
  }

  return dist;
}
