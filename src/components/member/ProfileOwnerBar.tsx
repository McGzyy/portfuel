"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Link2 } from "lucide-react";
import { getAppOrigin } from "@/lib/social/app-url";

export function ProfileOwnerBar({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${getAppOrigin()}/member/${username}`;

  async function copyPublicUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="pf-workspace-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <p className="text-sm text-[var(--pf-gray-600)]">
        <span className="font-semibold text-[var(--pf-black)]">This is your public profile.</span>{" "}
        Others see this page when they visit your track record.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyPublicUrl()}
          className="pf-chip-action h-9 gap-1.5 px-3 text-xs"
        >
          <Link2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          {copied ? "Link copied" : "Copy public link"}
        </button>
        <Link
          href="/settings"
          className="pf-chip-action h-9 gap-1.5 px-3 text-xs"
        >
          <Settings className="h-3.5 w-3.5" strokeWidth={2.25} />
          Account settings
        </Link>
      </div>
    </div>
  );
}
