"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppOrigin } from "@/lib/social/app-url";

function xIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function ShareTrackRecordCard({
  username,
  callCount,
  winRatePct,
  avgReturnPct,
}: {
  username: string;
  callCount: number;
  winRatePct?: number | null;
  avgReturnPct?: number | null;
}) {
  const [copied, setCopied] = useState(false);
  const cardUrl = `/api/social/track-record/${encodeURIComponent(username)}`;
  const origin = typeof window !== "undefined" ? window.location.origin : getAppOrigin();
  const profileUrl = `${origin}/member/${username}`;
  const cardAbsoluteUrl = `${origin}${cardUrl}`;

  if (callCount === 0) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function shareOnX() {
    const stats: string[] = [`${callCount} call${callCount === 1 ? "" : "s"} on record`];
    if (winRatePct != null) stats.push(`${winRatePct}% win rate`);
    if (avgReturnPct != null) {
      stats.push(`${avgReturnPct >= 0 ? "+" : ""}${avgReturnPct.toFixed(1)}% avg return`);
    }
    const text = `My verified track record on PortFuel — ${stats.join(" · ")}.`;
    window.open(xIntentUrl(text, cardAbsoluteUrl), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="pf-workspace-panel overflow-hidden">
      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Share · Track record card
          </p>
          <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
            Download a branded performance card with your cumulative return, top calls, and stats —
            ready for X or saving to your camera roll.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={cardUrl}
              download={`portfuel-${username}-track-record.png`}
              className="pf-chip-action h-9 gap-1.5 px-3 text-sm shadow-[var(--pf-shadow-sm)]"
            >
              <Download className="h-4 w-4" strokeWidth={2.25} />
              Download PNG
            </a>
            <Button type="button" size="sm" variant="outline" onClick={shareOnX}>
              Share on X
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => void copyLink()}>
              <Share2 className="mr-1.5 h-4 w-4" strokeWidth={2.25} />
              {copied ? "Link copied" : "Copy profile link"}
            </Button>
          </div>
        </div>
        <div className="shrink-0 sm:w-[min(100%,320px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardUrl}
            alt={`@${username} track record card preview`}
            className="w-full rounded-[var(--pf-radius)] border border-[var(--pf-border)] shadow-[var(--pf-shadow-sm)]"
          />
        </div>
      </div>
    </div>
  );
}
