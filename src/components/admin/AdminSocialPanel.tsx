"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { AdminSocialMilestonePanel } from "@/components/admin/AdminSocialMilestonePanel";
import { AdminMemberWinsPanel } from "@/components/admin/AdminMemberWinsPanel";
import { AdminSocialCopyPanel } from "@/components/admin/AdminSocialCopyPanel";
import { AdminWeeklyDigestPanel } from "@/components/admin/AdminWeeklyDigestPanel";
import { AdminSocialActivityPanel } from "@/components/admin/AdminSocialActivityPanel";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";

type XConfigSummary = {
  enabled: boolean;
  dryRun: boolean;
  bearerTokenSet: boolean;
  livePostingReady: boolean;
  fueledPosts: boolean;
  leaderboardPosts: boolean;
  memberWinPosts: boolean;
  weeklyDigestPosts: boolean;
  autopostFueledOnPublish: boolean;
  autopostMilestones: boolean;
};

export function AdminSocialPanel() {
  const [config, setConfig] = useState<XConfigSummary | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [previewType, setPreviewType] = useState<"fueled" | "leaderboard">("fueled");
  const [xLoading, setXLoading] = useState(false);
  const [xMessage, setXMessage] = useState("");
  const [forceRepost, setForceRepost] = useState(false);

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

  async function previewX(type: "fueled" | "leaderboard") {
    setXLoading(true);
    setXMessage("");
    setPreviewType(type);
    try {
      const res = await fetch("/api/admin/social/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPreviewText("");
        setXMessage(json.error === "no_content" ? "Nothing to post for that type yet." : "Preview failed.");
        return;
      }
      setPreviewText(json.text as string);
      setXMessage(`Preview · ${json.charCount} chars`);
    } catch {
      setXMessage("Preview failed.");
    } finally {
      setXLoading(false);
    }
  }

  async function postX(dryRun: boolean) {
    setXLoading(true);
    setXMessage("");
    try {
      const res = await fetch("/api/admin/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: previewType, dryRun, force: !dryRun && forceRepost }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "already_posted") {
          setXMessage(
            "Already posted for this content — toggle Force repost to send again, or wait for new content."
          );
          return;
        }
        setXMessage(json.error ?? "Post failed.");
        return;
      }
      setPreviewText(json.text ?? previewText);
      setXMessage(
        json.dryRun
          ? "Dry run — logged server-side; not sent to X."
          : `Posted to X (id ${json.tweetId}).`
      );
    } catch {
      setXMessage("Post failed.");
    } finally {
      setXLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <AdminPanelHeader
        group="Social & growth"
        title="X posts & publishing"
        description="Start with desk milestone charts — dry-run validates the full PNG + copy pipeline before live posting. Text-only cron posts (Fueled desk, rankings) are at the bottom. Inbound curation: X Ingest."
        footer={
          <>
            {config ? (
              <MetricsStrip
                variant="embedded"
                className="border-t border-[var(--pf-border)] pt-4 !px-0"
                eyebrow="X status"
                items={[
                  {
                    label: "Bearer",
                    value: config.bearerTokenSet ? "Set" : "Missing",
                    accent: config.bearerTokenSet ? "positive" : "negative",
                  },
                  {
                    label: "Live post",
                    value: config.livePostingReady ? "Ready" : "Blocked",
                    accent: config.livePostingReady ? "positive" : undefined,
                  },
                  { label: "API", value: config.enabled ? "On" : "Off" },
                  { label: "Dry run", value: config.dryRun ? "On" : "Off" },
                  {
                    label: "Auto milestones",
                    value: config.autopostMilestones ? "On" : "Off",
                  },
                  {
                    label: "Cron",
                    value: [
                      config.fueledPosts && "Fueled",
                      config.leaderboardPosts && "Rank",
                      config.memberWinPosts && "Wins",
                      config.weeklyDigestPosts && "Digest",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "All off",
                  },
                ]}
              />
            ) : null}
            <p className={config ? "mt-3" : undefined}>
              <a
                href="#milestone-charts"
                className="text-sm font-semibold text-[var(--pf-red)] hover:underline"
              >
                Milestone charts
              </a>
              {" · "}
              <a
                href="#member-wins"
                className="text-sm font-semibold text-[var(--pf-red)] hover:underline"
              >
                Member wins
              </a>
              {" · "}
              <a
                href="#weekly-digest"
                className="text-sm font-semibold text-[var(--pf-red)] hover:underline"
              >
                Weekly digest
              </a>
            </p>
          </>
        }
      />

      <AdminSocialMilestonePanel />

      <section className="pf-workspace-panel flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--pf-black)]">Curate from X</p>
          <p className="mt-1 text-xs text-[var(--pf-gray-600)]">
            Paste a tweet URL, analyze tickers, publish a Fueled desk call.
          </p>
        </div>
        <Link
          href="/calls/new"
          className="rounded-lg border border-[var(--pf-border)] px-4 py-2 text-sm font-semibold text-[var(--pf-red)] hover:bg-[var(--pf-red-muted)]"
        >
          Publish call →
        </Link>
      </section>

      <AdminSocialActivityPanel />

      <AdminSocialCopyPanel />

      <AdminMemberWinsPanel />

      <AdminWeeklyDigestPanel />

      <section className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
          Text-only cron posts
        </p>
        <h3 className="mt-1 text-base font-bold text-[var(--pf-black)]">
          Fueled desk & rankings (no chart)
        </h3>
        <p className="mt-2 text-sm text-[var(--pf-gray-600)]">
          Monday cron batch — link previews only. Milestone chart posts use the panel above.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={xLoading}
            onClick={() => void previewX("fueled")}
          >
            Preview Fueled post
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={xLoading}
            onClick={() => void previewX("leaderboard")}
          >
            Preview rankings post
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={xLoading || !previewText}
            onClick={() => void postX(true)}
          >
            Dry-run post
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={xLoading || !previewText || !config?.livePostingReady}
            onClick={() => void postX(false)}
          >
            Post to X
          </Button>
        </div>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--pf-gray-600)]">
          <input
            type="checkbox"
            className="accent-[var(--pf-red)]"
            checked={forceRepost}
            onChange={(e) => setForceRepost(e.target.checked)}
          />
          Force repost (ignore idempotency)
        </label>

        {xMessage ? <p className="mt-3 text-xs text-[var(--pf-gray-600)]">{xMessage}</p> : null}

        {previewText ? (
          <pre className="pf-admin-preview mt-4 max-h-48 overflow-auto rounded-lg border p-4 text-xs leading-relaxed whitespace-pre-wrap">
            {previewText}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
