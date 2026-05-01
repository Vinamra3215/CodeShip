import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { GFGUserStats } from "@/types/gfg";

const GFG_BASE = "https://www.geeksforgeeks.org";

const GFG_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Cache-Control": "no-cache",
  Referer: "https://www.geeksforgeeks.org",
};

class GFGAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "GFGAPIError";
  }
}

type GFGNextData = {
  props?: {
    pageProps?: {
      userHandle?: {
        handle?: string;
        totalProblemsSolved?: number;
        codingScore?: number;
        institute?: string;
        instituteRank?: number;
        currentStreak?: number;
        maxStreak?: number;
        contestRating?: number;
        solvedStats?: {
          school?: { count?: number };
          basic?: { count?: number };
          easy?: { count?: number };
          medium?: { count?: number };
          hard?: { count?: number };
        };
      };
    };
  };
};

export async function fetchGFGUserStats(username: string): Promise<GFGUserStats> {
  const response = await fetch(
    `${GFG_BASE}/user/${encodeURIComponent(username)}/`,
    {
      headers: GFG_HEADERS,
      next: { revalidate: 0 },
    }
  );

  if (response.status === 404) {
    throw new GFGAPIError(`User "${username}" not found on GeeksforGeeks`, 404);
  }

  if (!response.ok) {
    throw new GFGAPIError(`GFG HTTP ${response.status}`, response.status);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const nextDataScript = $("#__NEXT_DATA__").html();
  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript) as GFGNextData;
      const user = nextData?.props?.pageProps?.userHandle;

      if (user) {
        const solved = user.solvedStats ?? {};
        return {
          username: user.handle ?? username,
          totalSolved: user.totalProblemsSolved ?? 0,
          codingScore: user.codingScore ?? 0,
          institute: user.institute ?? "",
          instituteRank: user.instituteRank ?? 0,
          school: solved.school?.count ?? 0,
          basic: solved.basic?.count ?? 0,
          easy: solved.easy?.count ?? 0,
          medium: solved.medium?.count ?? 0,
          hard: solved.hard?.count ?? 0,
          currentStreak: user.currentStreak ?? 0,
          maxStreak: user.maxStreak ?? 0,
          contestRating: user.contestRating ?? 0,
        };
      }
    } catch {
    }
  }

  const scoreText = $(".scoreCard_head_left--score__oSi_x, .score_card_value")
    .first()
    .text()
    .trim();
  const codingScore = parseInt(scoreText.replace(/\D/g, ""), 10) || 0;

  const solvedText = $("[class*='problemsSolved'], [class*='total_problems_solved']")
    .first()
    .text()
    .trim();
  const totalSolved = parseInt(solvedText.replace(/\D/g, ""), 10) || 0;

  const instituteEl = $("[class*='educationDetails'], [class*='institute']")
    .first()
    .text()
    .trim();

  const getDiffCount = (label: string): number => {
    const el = $(`[class*='difficulty']`)
      .filter((_: number, node: Element) =>
        $(node).text().toLowerCase().includes(label)
      )
      .find("[class*='count'], strong, b")
      .first()
      .text()
      .trim();
    return parseInt(el.replace(/\D/g, ""), 10) || 0;
  };

  return {
    username,
    totalSolved,
    codingScore,
    institute: instituteEl,
    instituteRank: 0,
    school: getDiffCount("school"),
    basic: getDiffCount("basic"),
    easy: getDiffCount("easy"),
    medium: getDiffCount("medium"),
    hard: getDiffCount("hard"),
    currentStreak: 0,
    maxStreak: 0,
    contestRating: 0,
  };
}
