import { fetchTeaserCalls } from "@/lib/calls/service";
import type { TeaserCallRow } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoPublicTeasers } from "@/lib/demo/fixtures";

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
  if (isDemoMode()) return getDemoPublicTeasers();
  const [performing, proven] = await Promise.all([
    fetchTeaserCalls("teaser_public_performing"),
    fetchTeaserCalls("teaser_public_proven"),
  ]);
  return { performing, proven };
}
