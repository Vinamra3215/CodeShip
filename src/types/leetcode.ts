export interface LCSubmissionCount {
  difficulty: "All" | "Easy" | "Medium" | "Hard";
  count: number;
  submissions: number;
}

export interface LCUserStats {
  username: string;
  ranking: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
}

export interface LCTagCount {
  tagName: string;
  problemsSolved: number;
}

export interface LCContestEntry {
  contestTitle: string;
  rating: number;
  ranking: number;
  attended: boolean;
  date: number;
}

export interface LCContestRanking {
  rating: number;
  globalRanking: number;
  attendedContestsCount: number;
  topPercentage: number;
}

export interface LCTopicStats {
  [tagName: string]: number;
}
