"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminSocialMilestonePanel } from "@/components/admin/AdminSocialMilestonePanel";
import { AdminMemberWinsPanel } from "@/components/admin/AdminMemberWinsPanel";
import { AdminSocialCopyPanel } from "@/components/admin/AdminSocialCopyPanel";
import { AdminWeeklyDigestPanel } from "@/components/admin/AdminWeeklyDigestPanel";

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
    <div className="mt-8 space-y-8">
      <section className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          X Posts
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
          Outbound social publishing
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Preview and publish desk milestones, weekly rankings, and member spotlight posts with
          branded charts. To curate inbound X posts into desk research, use Admin → X Ingest.
        </p>

        {config ? (
          <ul className="mt-4 grid gap-2 text-xs text-[var(--pf-gray-600)] sm:grid-cols-2">
            <li>
              X bearer token:{" "}
              <span
                className={`font-semibold ${config.bearerTokenSet ? "text-emerald-700" : "text-rose-700"}`}
              >
                {config.bearerTokenSet ? "set" : "missing on server"}
              </span>
            </li>
            <li>
              Live post to X:{" "}
              <span
                className={`font-semibold ${config.livePostingReady ? "text-emerald-700" : "text-[var(--pf-black)]"}`}
              >
                {config.livePostingReady ? "ready" : "not yet"}
              </span>
            </li>
            <li>
              API enabled:{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.enabled ? "yes" : "no"}
              </span>
            </li>
            <li>
              Dry run:{" "}
              <span className="font-semibold text-[var(--pf-black)]">
                {config.dryRun ? "yes" : "no"}
              </span>
            </li>
            <li className="sm:col-span-2">
              Cron types: Fueled {config.fueledPosts ? "on" : "off"} · Leaderboard{" "}
              {config.leaderboardPosts ? "on" : "off"} · Member wins{" "}
              {config.memberWinPosts ? "on" : "off"} · Weekly digest{" "}
              {config.weeklyDigestPosts ? "on" : "off"} · Set vars on Vercel for production.
            </li>
          </ul>
        ) : null}

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
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4 text-xs leading-relaxed whitespace-pre-wrap text-[var(--pf-gray-800)]">
            {previewText}
          </pre>
        ) : null}
      </section>

      <AdminSocialCopyPanel />

      <AdminMemberWinsPanel />

      <AdminWeeklyDigestPanel />

      <AdminSocialMilestonePanel />
    </div>
  );
}
