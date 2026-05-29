"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSocialInboundPanel } from "@/components/admin/AdminSocialInboundPanel";

type XConfigSummary = {
  enabled: boolean;
  dryRun: boolean;
  configured: boolean;
  fueledPosts: boolean;
  leaderboardPosts: boolean;
  autopostFueledOnPublish: boolean;
};

export function AdminXIngestPanel() {
  const [config, setConfig] = useState<XConfigSummary | null>(null);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/admin/social/preview");
    if (res.ok) {
      const json = (await res.json()) as { config: XConfigSummary };
      setConfig(json.config);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return (
    <div className="mt-8 space-y-8">
      <section className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          X ingest
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
          Curate desk calls from X posts
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Paste an X URL (or manual text), extract tickers, analyze each one, then publish a Fueled
          desk call. Outbound milestone posts and copy templates live under{" "}
          <strong>Admin → X Posts</strong>.
        </p>

        {config ? (
          <ul className="mt-4 grid gap-2 text-xs text-[var(--pf-gray-600)] sm:grid-cols-2">
            <li>
              API enabled:{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.enabled ? "yes" : "no"}
              </span>
            </li>
            <li>
              Bearer token:{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.configured ? "set" : "missing"}
              </span>
            </li>
            <li>
              Dry run (outbound):{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.dryRun ? "yes" : "no"}
              </span>
            </li>
            <li>
              Auto-post on publish:{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.autopostFueledOnPublish ? "on" : "off"}
              </span>
            </li>
          </ul>
        ) : null}

        <p className="mt-4 text-xs text-[var(--pf-gray-500)]">
          Env toggles: see{" "}
          <code className="rounded bg-[var(--pf-gray-100)] px-1 py-0.5 text-[10px]">
            docs/X-SOCIAL.md
          </code>
          . URL fetch needs <code className="font-mono">X_API_BEARER_TOKEN</code> with read access.
        </p>
      </section>

      <AdminSocialInboundPanel />
    </div>
  );
}
