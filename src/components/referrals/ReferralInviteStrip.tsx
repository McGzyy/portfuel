"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import {
  REFERRAL_OVERVIEW_DISMISSED_KEY,
  type ReferralInvitePrompt,
} from "@/lib/referrals/prompt";
import { cn } from "@/lib/utils";

function useCopyLink(shareUrl: string) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [shareUrl]);

  return { copied, copy };
}

export function ReferralOverviewStrip({ prompt }: { prompt: ReferralInvitePrompt }) {
  const [dismissed, setDismissed] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const { copied, copy } = useCopyLink(prompt.shareUrl);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(REFERRAL_OVERVIEW_DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    setHydrated(true);
  }, []);

  if (!hydrated || dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(REFERRAL_OVERVIEW_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <section className="pf-workspace-panel relative p-4 sm:p-5">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-50)] hover:text-[var(--pf-black)]"
        aria-label="Dismiss referral invite"
      >
        <X className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
            <Gift className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--pf-black)]">
              Know another serious caller?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-600)]">
              Earn <strong className="font-semibold">{prompt.referrerReward}</strong> when they
              activate. They get <strong className="font-semibold">{prompt.refereeOffer}</strong> on
              their first month.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="rounded-lg bg-[var(--pf-black)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--pf-gray-800)]"
          >
            {copied ? "Link copied" : "Copy invite link"}
          </button>
          <Link
            href="/dashboard/settings#referrals"
            className="pf-chip-action px-3 py-2 text-xs font-semibold"
          >
            Referrals →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ReferralBannerActions({
  prompt,
  className,
  linkClassName,
}: {
  prompt: ReferralInvitePrompt;
  className?: string;
  linkClassName?: string;
}) {
  const { copied, copy } = useCopyLink(prompt.shareUrl);

  if (!prompt.programEnabled) return null;

  return (
    <div className={cn("mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold", className)}>
      <button
        type="button"
        onClick={() => void copy()}
        className={cn("hover:underline", linkClassName)}
      >
        {copied ? "Invite link copied" : `Invite a friend · ${prompt.referrerReward}`}
      </button>
      <Link href="/dashboard/settings#referrals" className={cn("hover:underline", linkClassName)}>
        Referrals →
      </Link>
    </div>
  );
}
