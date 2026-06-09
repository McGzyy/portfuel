"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { AdminSocialInboundPanel } from "@/components/admin/AdminSocialInboundPanel";

type XConfigSummary = {
  enabled: boolean;
  dryRun: boolean;
  bearerTokenSet: boolean;
  livePostingReady: boolean;
  fueledPosts: boolean;
  leaderboardPosts: boolean;
  autopostFueledOnPublish: boolean;
};

type IngestStatus = {
  openaiConfigured: boolean;
  config: XConfigSummary;
};

export function AdminXIngestPanel() {
  const [status, setStatus] = useState<IngestStatus | null>(null);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/admin/social/ingest-status");
    if (res.ok) {
      setStatus((await res.json()) as IngestStatus);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return (
    <div className="space-y-8">
      <AdminPanelHeader
        group="Social & growth"
        title="Curate desk calls from X posts"
        description="Paste an X URL (or manual text), extract tickers, analyze each one, then publish a Fueled desk call. Outbound milestone posts and copy templates live under Social."
        footer={
          status ? (
            <>
              <ul className="grid gap-2 text-xs text-[var(--pf-gray-600)] sm:grid-cols-2">
                <li>
                  OpenAI (analyze):{" "}
                  <span
                    className={`font-semibold ${status.openaiConfigured ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {status.openaiConfigured ? "ready" : "missing on server"}
                  </span>
                </li>
                <li>
                  X bearer token:{" "}
                  <span
                    className={`font-semibold ${status.config.bearerTokenSet ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {status.config.bearerTokenSet ? "set" : "missing on server"}
                  </span>
                </li>
                <li>
                  X API enabled:{" "}
                  <span className="font-semibold text-[var(--pf-black)]">
                    {status.config.enabled ? "yes" : "no"}
                  </span>
                </li>
                <li>
                  Dry run (outbound):{" "}
                  <span className="font-semibold text-[var(--pf-black)]">
                    {status.config.dryRun ? "yes" : "no"}
                  </span>
                </li>
                <li>
                  Live post to X:{" "}
                  <span
                    className={`font-semibold ${status.config.livePostingReady ? "text-emerald-700" : "text-[var(--pf-black)]"}`}
                  >
                    {status.config.livePostingReady ? "ready" : "not yet"}
                  </span>
                </li>
                <li>
                  Auto-post on publish:{" "}
                  <span className="font-semibold text-[var(--pf-black)]">
                    {status.config.autopostFueledOnPublish ? "on" : "off"}
                  </span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-[var(--pf-gray-500)]">
                Status reflects this deployment. See{" "}
                <code className="rounded bg-[var(--pf-gray-100)] px-1 py-0.5 text-[10px]">
                  docs/X-SOCIAL.md
                </code>
                . Without a bearer token, paste tweet text manually below the URL field.
              </p>
            </>
          ) : undefined
        }
      />

      <AdminSocialInboundPanel />
    </div>
  );
}
