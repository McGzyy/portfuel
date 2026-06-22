"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pf_walkthrough_tips_dismissed";

const TIPS = [
  {
    title: "Feed — new since last visit",
    body: "Green New badges and a banner count calls published after you last left the feed.",
    href: "/dashboard/feed",
    cta: "Open feed",
  },
  {
    title: "Watchlist → ticker intel",
    body: "Every symbol links to chart, calls, and desk context on the ticker page.",
    href: "/dashboard/watchlist",
    cta: "Watchlist",
  },
  {
    title: "Rankings — trusted members",
    body: "See how rank score and the Trusted badge are earned on the leaderboard.",
    href: "/dashboard/rankings",
    cta: "Rankings",
  },
] as const;

export function WorkspaceWalkthroughTips({
  enabled = true,
}: {
  /** Hide for members who already finished onboarding. */
  enabled?: boolean;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setDismissed(true);
      return;
    }
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [enabled]);

  if (!enabled) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <section
      className="pf-workspace-panel p-4"
      aria-label="Workspace tips"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Quick tour
          </p>
          <h2 className="mt-1 text-sm font-bold text-[var(--pf-black)]">Three places to know first</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1 text-[var(--pf-gray-400)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-gray-700)]"
          aria-label="Dismiss tips"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {TIPS.map((tip) => (
          <li
            key={tip.href}
            className="flex flex-col gap-2 rounded-lg border border-[var(--pf-border)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--pf-black)]">{tip.title}</p>
              <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{tip.body}</p>
            </div>
            <Link href={tip.href} className="shrink-0">
              <Button variant="outline" size="sm">
                {tip.cta}
              </Button>
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
      >
        Don&apos;t show again
      </button>
    </section>
  );
}
