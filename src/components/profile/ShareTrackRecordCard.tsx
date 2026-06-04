"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareTrackRecordCard({
  username,
  callCount,
}: {
  username: string;
  callCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const cardUrl = `/api/social/track-record/${encodeURIComponent(username)}`;
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/member/${username}`
      : `/member/${username}`;

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

  return (
    <div className="pf-workspace-panel flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Share · Track record
        </p>
        <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
          Download a verified performance card for X, LinkedIn, or Discord.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={cardUrl}
          download={`portfuel-${username}-track-record.png`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--pf-border)] bg-white px-3 text-sm font-semibold text-[var(--pf-gray-700)] shadow-[var(--pf-shadow-sm)] hover:bg-[var(--pf-gray-50)]"
        >
          <Download className="h-4 w-4" strokeWidth={2.25} />
          Download PNG
        </a>
        <Button type="button" size="sm" variant="secondary" onClick={() => void copyLink()}>
          <Share2 className="mr-1.5 h-4 w-4" strokeWidth={2.25} />
          {copied ? "Link copied" : "Copy profile link"}
        </Button>
      </div>
    </div>
  );
}
