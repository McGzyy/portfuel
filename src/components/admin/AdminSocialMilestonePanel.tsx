"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import {
  COPY_PLACEHOLDER_HELP,
  composeMilestonePostText,
  type SocialPostCopy,
} from "@/lib/social/copy-templates";

type MilestoneKey = "return_10" | "return_25" | "target_reached";

type XConfigSummary = {
  enabled: boolean;
  dryRun: boolean;
  bearerTokenSet: boolean;
  livePostingReady: boolean;
  autopostMilestones: boolean;
};

type MilestoneItem = {
  callId: string;
  symbol: string;
  direction: string;
  return_pct: number | null;
  milestone: MilestoneKey;
  refId: string;
  posted: boolean;
  chartUrl: string;
};

const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  return_10: "+10%",
  return_25: "+25%",
  target_reached: "Target",
};

const DEMO_MILESTONES: MilestoneKey[] = ["return_10", "return_25", "target_reached"];

const DEMO_PREVIEW = {
  return_10: { symbol: "NVDA", direction: "long", returnPct: 12.4 },
  return_25: { symbol: "NVDA", direction: "long", returnPct: 27.8 },
  target_reached: { symbol: "NVDA", direction: "long", returnPct: 18.6 },
} as const;

const DEMO_LINK = "https://portfuel.pro/ticker/NVDA?utm_source=x&utm_medium=social&utm_campaign=fueled_milestone";
const DEMO_CALL_ID = "demo-call-001";

type PostPreview = {
  lead: string;
  tail: string;
  text: string;
  chartUrl: string;
  cacheKey: string;
};

function formatPostError(error: string): string {
  switch (error) {
    case "already_posted":
      return "Already posted for this milestone.";
    case "disabled":
      return "X API is disabled — set X_API_ENABLED=true in env.";
    case "chart_failed":
      return "Chart render failed — check server logs.";
    case "no_content":
      return "Call not found or not a Fueled desk call.";
    case "invalid_input":
      return "Invalid request — check call id and milestone.";
    default:
      return error.startsWith("http_") || error === "no_token"
        ? `X API error: ${error}`
        : "Post failed.";
  }
}

function XPostLayout({ preview }: { preview: PostPreview }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[#0a0a0a] shadow-lg">
      <div className="border-b border-white/10 bg-[#111] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          X post preview
        </p>
        <pre className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-white">{preview.lead}</pre>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-white/30">
          ↓ chart image attached below ↓
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${preview.chartUrl}&k=${preview.cacheKey}`}
        alt="Milestone chart"
        className="w-full"
      />
      {preview.tail ? (
        <div className="border-t border-white/10 bg-[#111] px-4 py-3">
          <pre className="text-xs leading-relaxed whitespace-pre-wrap text-white/70">{preview.tail}</pre>
          <p className="mt-2 text-[10px] text-white/35">
            Full tweet · {preview.text.length} / 280 chars
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function AdminSocialMilestonePanel() {
  const [demoMilestone, setDemoMilestone] = useState<MilestoneKey>("return_25");
  const [demoChartKey, setDemoChartKey] = useState(0);
  const [copyDraft, setCopyDraft] = useState<SocialPostCopy | null>(null);
  const [copySaving, setCopySaving] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const [items, setItems] = useState<MilestoneItem[]>([]);
  const [selected, setSelected] = useState<MilestoneItem | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [previewLead, setPreviewLead] = useState("");
  const [previewTail, setPreviewTail] = useState("");
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [xConfig, setXConfig] = useState<XConfigSummary | null>(null);
  const [postPreview, setPostPreview] = useState<PostPreview | null>(null);

  const loadCopy = useCallback(async () => {
    const res = await fetch("/api/admin/social/copy");
    if (res.ok) {
      const json = (await res.json()) as { copy: SocialPostCopy };
      setCopyDraft(json.copy);
    }
  }, []);

  const loadXConfig = useCallback(async () => {
    const res = await fetch("/api/admin/social/preview");
    if (res.ok) {
      const json = (await res.json()) as { config: XConfigSummary };
      setXConfig(json.config);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social/fueled-milestones");
      if (res.ok) {
        const json = (await res.json()) as { milestones: MilestoneItem[] };
        setItems(json.milestones);
        if (json.milestones[0]) {
          setSelected(json.milestones[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCopy();
    void loadXConfig();
    void load();
  }, [loadCopy, loadXConfig, load]);

  function applyPostResponse(json: {
    text: string;
    lead?: string;
    tail?: string;
    chartUrl?: string;
    chartGenerated?: boolean;
    chartSizeBytes?: number;
    dryRun?: boolean;
    tweetId?: string;
    mediaAttached?: boolean;
  }) {
    setPreviewText(json.text);
    setPreviewLead(json.lead ?? "");
    setPreviewTail(json.tail ?? "");
    if (json.chartUrl) {
      setPostPreview({
        lead: json.lead ?? "",
        tail: json.tail ?? "",
        text: json.text,
        chartUrl: json.chartUrl,
        cacheKey: String(Date.now()),
      });
    }
    if (json.dryRun) {
      const kb =
        json.chartSizeBytes != null ? `${Math.round(json.chartSizeBytes / 1024)} KB` : null;
      setMessage(
        json.chartGenerated
          ? `Dry run OK — chart rendered${kb ? ` (${kb})` : ""}; tweet not sent to X.`
          : "Dry run OK — copy only; chart did not render."
      );
    } else {
      setMessage(
        json.mediaAttached
          ? `Posted to X with chart (id ${json.tweetId}).`
          : `Posted to X without chart attachment (id ${json.tweetId}).`
      );
    }
  }

  async function runMilestonePost(input: {
    callId: string;
    milestone: MilestoneKey;
    dryRun: boolean;
    force?: boolean;
  }) {
    setPostLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "fueled_milestone",
          callId: input.callId,
          milestone: input.milestone,
          dryRun: input.dryRun,
          force: input.force,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(formatPostError(json.error as string));
        return;
      }
      applyPostResponse(json);
      if (!input.dryRun) void load();
    } catch {
      setMessage("Post failed.");
    } finally {
      setPostLoading(false);
    }
  }

  const demoPreview = useMemo(() => {
    if (!copyDraft) return null;
    const demo = DEMO_PREVIEW[demoMilestone];
    return composeMilestonePostText(copyDraft, {
      milestone: demoMilestone,
      symbol: demo.symbol,
      direction: demo.direction,
      returnPct: demo.returnPct,
      link: DEMO_LINK,
    });
  }, [copyDraft, demoMilestone]);

  async function saveCopy() {
    if (!copyDraft) return;
    setCopySaving(true);
    setCopyMessage("");
    try {
      const res = await fetch("/api/admin/social/copy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneLeadTemplate: copyDraft.milestoneLeadTemplate,
          milestoneTailTemplate: copyDraft.milestoneTailTemplate,
          disclaimer: copyDraft.disclaimer,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCopyMessage(json.error === "db_error" ? "Save failed — run the social_post_copy migration." : "Save failed.");
        return;
      }
      setCopyDraft(json.copy as SocialPostCopy);
      setCopyMessage("Post copy saved.");
      setDemoChartKey((k) => k + 1);
    } catch {
      setCopyMessage("Save failed.");
    } finally {
      setCopySaving(false);
    }
  }

  function selectDemo(milestone: MilestoneKey) {
    setDemoMilestone(milestone);
    setMessage("");
    setDemoChartKey((k) => k + 1);
  }

  async function preview(item: MilestoneItem) {
    setSelected(item);
    setMessage("");
    const res = await fetch("/api/admin/social/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "fueled_milestone",
        callId: item.callId,
        milestone: item.milestone,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setPreviewText(json.text as string);
      setPreviewLead((json.lead as string) ?? "");
      setPreviewTail((json.tail as string) ?? "");
    }
  }

  async function post(item: MilestoneItem, dryRun: boolean) {
    setSelected(item);
    await runMilestonePost({ callId: item.callId, milestone: item.milestone, dryRun });
  }

  async function dryRunDemo() {
    await runMilestonePost({
      callId: DEMO_CALL_ID,
      milestone: demoMilestone,
      dryRun: true,
    });
  }

  const demoChartUrl = `/api/admin/social/demo-chart?milestone=${demoMilestone}&format=png&k=${demoChartKey}`;
  const demoSvgUrl = `/api/admin/social/demo-chart?milestone=${demoMilestone}&format=svg&k=${demoChartKey}`;

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Milestone charts
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
        Fueled desk milestone posts with chart image
      </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          Dry-run renders the real chart server-side and previews the full tweet layout — no X send.
          Live posts attach the PNG when{" "}
          <code className="rounded bg-[var(--pf-gray-100)] px-1 py-0.5 text-xs">X_API_DRY_RUN=false</code>{" "}
          and bearer token is set.
        </p>

      {xConfig ? (
        <MetricsStrip
          variant="embedded"
          className="mt-4 border-t border-[var(--pf-border)] pt-4 !px-0"
          eyebrow="X milestone posts"
          items={[
            {
              label: "Bearer",
              value: xConfig.bearerTokenSet ? "Set" : "Missing",
              accent: xConfig.bearerTokenSet ? "positive" : "negative",
            },
            {
              label: "Live post",
              value: xConfig.livePostingReady ? "Ready" : "Blocked",
              accent: xConfig.livePostingReady ? "positive" : undefined,
            },
            { label: "Dry run", value: xConfig.dryRun ? "On" : "Off" },
            {
              label: "Auto",
              value: xConfig.autopostMilestones ? "Milestones on" : "Milestones off",
            },
          ]}
        />
      ) : null}

      <div className="mt-6 rounded-xl border-2 border-dashed border-[var(--pf-red)]/30 bg-[var(--pf-gray-50)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-red)]">
              Design preview · demo
            </p>
            <h3 className="mt-1 text-base font-bold text-[var(--pf-black)]">
              Sample NVDA milestone post
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={demoChartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Open PNG
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href={demoSvgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-gray-600)] hover:underline"
            >
              Open SVG
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <Label>Milestone badge</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_MILESTONES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selectDemo(m)}
                className={
                  demoMilestone === m
                    ? "rounded-full border border-[var(--pf-red)] bg-[var(--pf-red-muted)] px-3 py-1 text-xs font-bold text-[var(--pf-red)]"
                    : "rounded-full border border-[var(--pf-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-300)]"
                }
              >
                {MILESTONE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {copyDraft ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="milestone-lead">Post text above chart</Label>
              <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                Headline and return line — shown above the image on X.
              </p>
              <Textarea
                id="milestone-lead"
                className="mt-2 min-h-[100px] font-mono text-xs"
                value={copyDraft.milestoneLeadTemplate}
                onChange={(e) =>
                  setCopyDraft({ ...copyDraft, milestoneLeadTemplate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="milestone-tail">Post text below chart</Label>
              <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                Link and disclaimer — still part of the tweet, under the image on X.
              </p>
              <Textarea
                id="milestone-tail"
                className="mt-2 min-h-[100px] font-mono text-xs"
                value={copyDraft.milestoneTailTemplate}
                onChange={(e) =>
                  setCopyDraft({ ...copyDraft, milestoneTailTemplate: e.target.value })
                }
              />
            </div>
          </div>
        ) : null}

        <details className="mt-3 text-xs text-[var(--pf-gray-500)]">
          <summary className="cursor-pointer font-semibold text-[var(--pf-gray-600)]">
            Placeholders
          </summary>
          <ul className="mt-2 list-inside list-disc space-y-0.5">
            {COPY_PLACEHOLDER_HELP.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" disabled={copySaving || !copyDraft} onClick={() => void saveCopy()}>
            {copySaving ? "Saving…" : "Save post copy"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={postLoading}
            onClick={() => void dryRunDemo()}
          >
            {postLoading ? "Running…" : "Dry-run demo post"}
          </Button>
          {copyMessage ? <span className="text-xs text-[var(--pf-gray-600)]">{copyMessage}</span> : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[#0a0a0a] shadow-lg">
          <div className="border-b border-white/10 bg-[#111] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              X post preview
            </p>
            {demoPreview ? (
              <>
                <pre className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-white">
                  {demoPreview.lead}
                </pre>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-white/30">
                  ↓ chart image attached below ↓
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/50">Loading copy…</p>
            )}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={demoChartKey}
            src={demoChartUrl}
            alt="Demo milestone chart preview"
            className="w-full"
          />

          {demoPreview?.tail ? (
            <div className="border-t border-white/10 bg-[#111] px-4 py-3">
              <pre className="text-xs leading-relaxed whitespace-pre-wrap text-white/70">
                {demoPreview.tail}
              </pre>
              <p className="mt-2 text-[10px] text-white/35">
                Full tweet · {demoPreview.text.length} / 280 chars
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {postPreview ? (
        <div className="mt-6 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Server dry-run / live preview
          </p>
          <XPostLayout preview={postPreview} />
        </div>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">Checking live milestones…</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">
          No live Fueled calls at a milestone yet — use dry-run demo above to validate the full pipeline.
        </p>
      ) : (
        <div className="mt-8 space-y-4 border-t border-[var(--pf-border)] pt-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Live milestones
            </p>
            <Label className="mt-2 block">Ready to post</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {items.map((item) => (
                <button
                  key={item.refId}
                  type="button"
                  onClick={() => void preview(item)}
                  className={
                    selected?.refId === item.refId
                      ? "rounded-full border border-[var(--pf-red)] bg-[var(--pf-red-muted)] px-3 py-1 text-xs font-bold text-[var(--pf-red)]"
                      : "rounded-full border border-[var(--pf-border)] px-3 py-1 text-xs font-semibold text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-300)]"
                  }
                >
                  {item.symbol} · {MILESTONE_LABELS[item.milestone]}
                  {item.posted ? " ✓" : ""}
                </button>
              ))}
            </div>
          </div>

          {selected && previewLead && !postPreview ? (
            <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Copy preview
              </p>
              <pre className="mt-2 text-xs leading-relaxed whitespace-pre-wrap text-[var(--pf-gray-800)]">
                {previewLead}
              </pre>
            </div>
          ) : null}

          {selected && !postPreview ? (
            <div className="overflow-hidden rounded-lg border border-[var(--pf-border)] bg-[#0f1419]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${selected.chartUrl}&t=${selected.refId}`}
                alt={`${selected.symbol} milestone chart`}
                className="w-full"
              />
            </div>
          ) : null}

          {selected && previewTail && !postPreview ? (
            <pre className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-3 text-xs leading-relaxed whitespace-pre-wrap text-[var(--pf-gray-700)]">
              {previewTail}
            </pre>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selected}
              onClick={() => selected && void preview(selected)}
            >
              Preview copy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={postLoading || !selected}
              onClick={() => selected && void post(selected, true)}
            >
              Dry-run post
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={postLoading || !selected || !xConfig?.livePostingReady}
              title={
                xConfig?.livePostingReady
                  ? undefined
                  : "Set X_API_ENABLED, bearer token, and X_API_DRY_RUN=false for live posts"
              }
              onClick={() => selected && void post(selected, false)}
            >
              Post to X with chart
            </Button>
          </div>

          {previewText && !postPreview ? (
            <pre className="max-h-32 overflow-auto rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-3 text-xs whitespace-pre-wrap">
              {previewText}
            </pre>
          ) : null}
        </div>
      )}

      {message ? <p className="mt-3 text-xs text-[var(--pf-gray-600)]">{message}</p> : null}
    </section>
  );
}
