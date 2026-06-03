/** Eligibility for brand X “member win” posts — see docs/MARKETING-PLAN.md */

export type MemberWinGateConfig = {
  /** Minimum return % (default 20 — stricter than public homepage teasers). */
  minReturnPct: number;
  /** Minimum hours since call before normal path qualifies (anti same-day pump). */
  minAgeHours: number;
  /** Fast track: min return % with shorter age requirement. */
  fastTrackReturnPct: number;
  fastTrackMinAgeHours: number;
  /** Hours after first qualifying snapshot before we may post to X. */
  sustainHours: number;
};

function envNum(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function getMemberWinGateConfig(): MemberWinGateConfig {
  return {
    minReturnPct: envNum("X_MEMBER_WIN_MIN_RETURN_PCT", 20),
    minAgeHours: envNum("X_MEMBER_WIN_MIN_AGE_HOURS", 48),
    fastTrackReturnPct: envNum("X_MEMBER_WIN_FAST_TRACK_RETURN_PCT", 30),
    fastTrackMinAgeHours: envNum("X_MEMBER_WIN_FAST_TRACK_MIN_AGE_HOURS", 36),
    sustainHours: envNum("X_MEMBER_WIN_SUSTAIN_HOURS", 48),
  };
}

export const MEMBER_WIN_GATE_MILESTONE_KEY = "social_win_gate";
