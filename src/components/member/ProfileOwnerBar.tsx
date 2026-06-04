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
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--pf-border)] bg-white px-3 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
        >
          <Link2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          {copied ? "Link copied" : "Copy public link"}
        </button>
        <Link
          href="/settings"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--pf-border)] bg-white px-3 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
        >
          <Settings className="h-3.5 w-3.5" strokeWidth={2.25} />
          Account settings
        </Link>
      </div>
    </div>
  );
}
