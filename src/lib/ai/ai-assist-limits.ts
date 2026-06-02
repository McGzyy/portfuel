export const AI_ASSIST_LIMITS = {
  defaultPerDay: 10,
  deepPerDay: 3,
} as const;

export type AiAssistMode = "default" | "deep";

export function limitForMode(mode: AiAssistMode): number {
  return mode === "deep" ? AI_ASSIST_LIMITS.deepPerDay : AI_ASSIST_LIMITS.defaultPerDay;
}

