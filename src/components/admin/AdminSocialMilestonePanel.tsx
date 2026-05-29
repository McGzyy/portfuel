"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COPY_PLACEHOLDER_HELP,
  composeMilestonePostText,
  type SocialPostCopy,
} from "@/lib/social/copy-templates";

type MilestoneKey = "return_10" | "return_25" | "target_reached";

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

  const loadCopy = useCallback(async () => {
    const res = await fetch("/api/admin/social/copy");
    if (res.ok) {
      const json = (await res.json()) as { copy: SocialPostCopy };
      setCopyDraft(json.copy);
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
    void load();
  }, [loadCopy, load]);

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
    setPostLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "fueled_milestone",
          callId: item.callId,
          milestone: item.milestone,
          dryRun,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error === "already_posted" ? "Already posted for this milestone." : "Post failed.");
        return;
      }
      setPreviewText(json.text ?? previewText);
      setMessage(
        json.dryRun
          ? "Dry run — chart generated server-side; not sent to X."
          : `Posted to X with chart (id ${json.tweetId}).`
      );
      void load();
    } catch {
      setMessage("Post failed.");
    } finally {
      setPostLoading(false);
    }
  }

  const demoChartUrl = `/api/admin/social/demo-chart?milestone=${demoMilestone}&format=png&k=${demoChartKey}`;

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Milestone charts
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
        Fueled desk milestone posts with chart image
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
        Edit the text that appears above the chart on X, preview the full post layout, then publish
        when live milestones hit.
      </p>

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
          <Link
            href={demoChartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Open chart full size
            <ExternalLink className="h-3 w-3" />
          </Link>
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

      {loading ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">Checking live milestones…</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">
          No live Fueled calls at a milestone yet — use the demo above to refine copy and chart design.
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

          {selected && previewLead ? (
            <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Live post preview
              </p>
              <pre className="mt-2 text-xs leading-relaxed whitespace-pre-wrap text-[var(--pf-gray-800)]">
                {previewLead}
              </pre>
            </div>
          ) : null}

          {selected ? (
            <div className="overflow-hidden rounded-lg border border-[var(--pf-border)] bg-[#0f1419]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${selected.chartUrl}&t=${selected.refId}`}
                alt={`${selected.symbol} milestone chart`}
                className="w-full"
              />
            </div>
          ) : null}

          {selected && previewTail ? (
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
              disabled={postLoading || !selected}
              onClick={() => selected && void post(selected, false)}
            >
              Post to X with chart
            </Button>
          </div>

          {previewText ? (
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
