"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { ReferralBannerActions } from "@/components/referrals/ReferralInviteStrip";
import type { ReferralInvitePrompt } from "@/lib/referrals/prompt";
import {
  CHECKLIST_COMPLETE_DISMISSED_KEY,
  CHECKLIST_DESK_VISITED_KEY,
  computeWorkspaceChecklistProgress,
} from "@/lib/onboarding/workspace-checklist";

export function WorkspaceChecklistCompleteBanner({
  publishedCall,
  watchlistCount,
  journalThesisCount,
  followingCount,
  referralPrompt,
}: {
  publishedCall: boolean;
  watchlistCount: number;
  journalThesisCount: number;
  followingCount: number;
  referralPrompt?: ReferralInvitePrompt | null;
}) {
  const [deskVisited, setDeskVisited] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const readStorage = useCallback(() => {
    try {
      setDeskVisited(localStorage.getItem(CHECKLIST_DESK_VISITED_KEY) === "1");
      setDismissed(localStorage.getItem(CHECKLIST_COMPLETE_DISMISSED_KEY) === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    readStorage();
    const onUpdate = () => readStorage();
    window.addEventListener("pf-checklist-update", onUpdate);
    window.addEventListener("focus", readStorage);
    return () => {
      window.removeEventListener("pf-checklist-update", onUpdate);
      window.removeEventListener("focus", readStorage);
    };
  }, [readStorage]);

  const progress = useMemo(
    () =>
      computeWorkspaceChecklistProgress({
        publishedCall,
        watchlistCount,
        journalThesisCount,
        followingCount,
        deskVisited,
      }),
    [publishedCall, watchlistCount, journalThesisCount, followingCount, deskVisited]
  );

  if (!hydrated || dismissed) return null;
  if (progress.completed < progress.total) return null;

  function dismiss() {
    try {
      localStorage.setItem(CHECKLIST_COMPLETE_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <section className="relative overflow-hidden rounded-[var(--pf-radius-lg)] border border-emerald-200/90 bg-emerald-50/80 px-5 py-4 shadow-[var(--pf-shadow-sm)] sm:px-6">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-800/70 hover:bg-[var(--pf-surface)]/60 hover:text-emerald-950"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <div className="flex gap-3 pr-8">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" strokeWidth={2.25} />
        <div>
          <p className="text-sm font-bold text-emerald-950">Workspace launch complete</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">
            You&apos;re set up — calls on record, watchlist seeded, and desk visited. Next: scan the{" "}
            <Link href="/dashboard/feed" className="font-semibold underline hover:no-underline">
              member feed
            </Link>
            , run{" "}
            <Link href="/dashboard/research?tab=compare" className="font-semibold underline hover:no-underline">
              ticker compare
            </Link>
            , or publish another thesis when you&apos;re ready.
          </p>
          {referralPrompt ? (
            <ReferralBannerActions
              prompt={referralPrompt}
              className="mt-3"
              linkClassName="text-emerald-800"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
