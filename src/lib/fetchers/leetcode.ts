import type {
  LCUserStats,
  LCTopicStats,
  LCContestEntry,
  LCContestRanking,
  LCTagCount,
} from "@/types/leetcode";

const LC_GRAPHQL = "https://leetcode.com/graphql";

const LC_HEADERS = {
  "Content-Type": "application/json",
  "Referer": "https://leetcode.com",
  "Origin": "https://leetcode.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

class LeetCodeAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "LeetCodeAPIError";
  }
}

async function lcQuery<T>(query: string, variables: Record<string, string>): Promise<T> {
  const response = await fetch(LC_GRAPHQL, {
    method: "POST",
    headers: LC_HEADERS,
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new LeetCodeAPIError(
      `LeetCode GraphQL HTTP ${response.status}`,
      response.status
    );
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new LeetCodeAPIError(json.errors[0].message);
  }

  return json.data as T;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchLCUserStats(username: string): Promise<LCUserStats> {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        profile {
          ranking
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
    }
  `;

  const data = await lcQuery<{
    matchedUser: {
      profile: { ranking: number };
      submitStats: { acSubmissionNum: Array<{ difficulty: string; count: number; submissions: number }> };
    } | null;
  }>(query, { username });

  if (!data.matchedUser) {
    throw new LeetCodeAPIError(`User "${username}" not found on LeetCode`);
  }

  const counts = data.matchedUser.submitStats.acSubmissionNum;
  const all = counts.find((c) => c.difficulty === "All");
  const easy = counts.find((c) => c.difficulty === "Easy");
  const medium = counts.find((c) => c.difficulty === "Medium");
  const hard = counts.find((c) => c.difficulty === "Hard");

  const totalSolved = all?.count ?? 0;
  const totalSubmissions = all?.submissions ?? 1;

  return {
    username,
    ranking: data.matchedUser.profile.ranking,
    totalSolved,
    easySolved: easy?.count ?? 0,
    mediumSolved: medium?.count ?? 0,
    hardSolved: hard?.count ?? 0,
    acceptanceRate: totalSubmissions > 0 ? (totalSolved / totalSubmissions) * 100 : 0,
  };
}

export async function fetchLCTopicStats(username: string): Promise<LCTopicStats> {
  await delay(1000);

  const query = `
    query skillStats($username: String!) {
      matchedUser(username: $username) {
        tagProblemCounts {
          advanced { tagName problemsSolved }
          intermediate { tagName problemsSolved }
          fundamental { tagName problemsSolved }
        }
      }
    }
  `;

  const data = await lcQuery<{
    matchedUser: {
      tagProblemCounts: {
        advanced: LCTagCount[];
        intermediate: LCTagCount[];
        fundamental: LCTagCount[];
      };
    } | null;
  }>(query, { username });

  if (!data.matchedUser) return {};

  const { advanced, intermediate, fundamental } = data.matchedUser.tagProblemCounts;
  const all = [...advanced, ...intermediate, ...fundamental];

  const stats: LCTopicStats = {};
  for (const tag of all) {
    if (tag.problemsSolved > 0) {
      stats[tag.tagName] = (stats[tag.tagName] ?? 0) + tag.problemsSolved;
    }
  }

  return stats;
}

export async function fetchLCContestHistory(username: string): Promise<{
  ranking: LCContestRanking | null;
  history: LCContestEntry[];
}> {
  await delay(1000);

  const query = `
    query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        rating
        globalRanking
        attendedContestsCount
        topPercentage
      }
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        contest {
          title
          startTime
        }
      }
    }
  `;

  const data = await lcQuery<{
    userContestRanking: {
      rating: number;
      globalRanking: number;
      attendedContestsCount: number;
      topPercentage: number;
    } | null;
    userContestRankingHistory: Array<{
      attended: boolean;
      rating: number;
      ranking: number;
      contest: { title: string; startTime: number };
    }> | null;
  }>(query, { username });

  const ranking = data.userContestRanking
    ? {
        rating: data.userContestRanking.rating,
        globalRanking: data.userContestRanking.globalRanking,
        attendedContestsCount: data.userContestRanking.attendedContestsCount,
        topPercentage: data.userContestRanking.topPercentage,
      }
    : null;

  const history: LCContestEntry[] = (data.userContestRankingHistory ?? [])
    .filter((e) => e.attended)
    .map((e) => ({
      contestTitle: e.contest.title,
      rating: Math.round(e.rating),
      ranking: e.ranking,
      attended: e.attended,
      date: e.contest.startTime,
    }));

  return { ranking, history };
}
