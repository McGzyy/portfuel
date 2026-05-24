import { fetchTeaserCalls } from "@/lib/calls/service";
import type { TeaserCallRow } from "@/lib/db/supabase";

/** Minimum return % shown on the public homepage (must match SQL views). */
export const PUBLIC_TEASER_THRESHOLDS = {
  performing30dMinReturnPct: 5,
  provenMinReturnPct: 10,
  provenMinAgeDays: 7,
} as const;

export type PublicLandingTeasers = {
  performing: TeaserCallRow[];
  proven: TeaserCallRow[];
};

export async function fetchPublicLandingTeasers(): Promise<PublicLandingTeasers> {
  const [performing, proven] = await Promise.all([
    fetchTeaserCalls("teaser_public_performing"),
    fetchTeaserCalls("teaser_public_proven"),
  ]);
  return { performing, proven };
}
