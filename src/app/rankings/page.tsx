import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { RankingsPageContent } from "@/components/rankings/RankingsPageContent";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { summarizeRankings } from "@/lib/calls/rankings-summary";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Rankings",
  description: `Member leaderboard and rank scores on ${SITE_NAME} — ${SITE_TAGLINE}.`,
};

export default async function RankingsPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard/rankings");
  }

  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  let rows: Awaited<ReturnType<typeof fetchLeaderboard>> = [];
  if (isDemoMode() || hasSupabaseConfig()) {
    try {
      rows = await fetchLeaderboard(30);
    } catch (e) {
      console.error("[rankings]", e);
    }
  }

  const summary = summarizeRankings(rows);

  return (
    <>
      <SiteHeader showAuth />
      <div className="pf-app-bg flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <RankingsPageContent
            rows={rows}
            summary={summary}
            proLocked={proLocked}
            proGateCta={proGateCta}
            loggedIn={false}
          />
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
            <Link href="/join">
              <Button>{COPY.ctaGetAccess}</Button>
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
