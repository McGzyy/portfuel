export type FollowedMember = {
  userId: string;
  username: string;
  displayName: string | null;
};

export type SuggestedFollow = {
  userId: string;
  username: string;
  displayName: string | null;
  rankScore: number;
  trusted: boolean;
  /** Human-readable match, e.g. "Active on NVDA, AMD" */
  reason: string;
  overlapSymbols: string[];
  overlapCalls: number;
  avgReturnPct: number | null;
};
