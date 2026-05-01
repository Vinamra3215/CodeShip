import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { CCUserStats } from "@/types/codechef";

const CC_BASE = "https://www.codechef.com";

const CC_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Cache-Control": "no-cache",
};

class CodeChefAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "CodeChefAPIError";
  }
}

function starsFromRating(rating: number): string {
  if (rating < 1400) return "1★";
  if (rating < 1600) return "2★";
  if (rating < 1800) return "3★";
  if (rating < 2000) return "4★";
  if (rating < 2200) return "5★";
  if (rating < 2500) return "6★";
  return "7★";
}

type NextData = {
  props?: {
    pageProps?: {
      userDetails?: {
        username?: string;
        currentRating?: number;
        highestRating?: number;
        globalRank?: number;
        countryRank?: number;
        stars?: string;
        totalProblemsSolved?: number;
        problemFullySolved?: number;
        allProblems?: { fullysolvedProblems?: number };
      };
    };
  };
};

export async function fetchCCUserStats(username: string): Promise<CCUserStats> {
  const response = await fetch(`${CC_BASE}/users/${encodeURIComponent(username)}`, {
    headers: CC_HEADERS,
    next: { revalidate: 0 },
  });

  if (response.status === 404) {
    throw new CodeChefAPIError(`User "${username}" not found on CodeChef`, 404);
  }

  if (!response.ok) {
    throw new CodeChefAPIError(
      `CodeChef HTTP ${response.status}`,
      response.status
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const nextDataScript = $("#__NEXT_DATA__").html();
  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript) as NextData;
      const user = nextData?.props?.pageProps?.userDetails;

      if (user) {
        const currentRating = user.currentRating ?? 0;
        const highestRating = user.highestRating ?? currentRating;
        const problemsSolved =
          user.problemFullySolved ??
          user.totalProblemsSolved ??
          user.allProblems?.fullysolvedProblems ??
          0;

        return {
          username: user.username ?? username,
          currentRating,
          highestRating,
          globalRank: user.globalRank ?? 0,
          countryRank: user.countryRank ?? 0,
          stars: user.stars ?? starsFromRating(currentRating),
          problemsSolved,
        };
      }
    } catch {
    }
  }

  const ratingText = $(".rating-number").first().text().trim();
  const currentRating = parseInt(ratingText, 10) || 0;

  const highestText = $(".rating-header").filter((_: number, el: Element) =>
    $(el).text().includes("Highest")
  ).next(".rating-number").text().trim();
  const highestRating = parseInt(highestText, 10) || currentRating;

  const globalRankText = $(".rating-ranks")
    .find("strong")
    .first()
    .text()
    .trim();
  const globalRank = parseInt(globalRankText.replace(/,/g, ""), 10) || 0;

  const countryRankText = $(".rating-ranks")
    .find("strong")
    .eq(1)
    .text()
    .trim();
  const countryRank = parseInt(countryRankText.replace(/,/g, ""), 10) || 0;

  const starsEl = $("[class*='star']").first().text().trim();
  const stars = starsEl || starsFromRating(currentRating);

  const solvedText = $(".problems-solved")
    .find("h5")
    .filter((_: number, el: Element) => $(el).text().includes("Fully Solved"))
    .text()
    .replace(/\D/g, "");
  const problemsSolved = parseInt(solvedText, 10) || 0;

  return {
    username,
    currentRating,
    highestRating,
    globalRank,
    countryRank,
    stars,
    problemsSolved,
  };
}
