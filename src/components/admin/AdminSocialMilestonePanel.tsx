"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

export function AdminSocialMilestonePanel() {
  const [demoMilestone, setDemoMilestone] = useState<MilestoneKey>("return_25");
  const [demoTweetCopy, setDemoTweetCopy] = useState("");
  const [demoChartKey, setDemoChartKey] = useState(0);

  const [items, setItems] = useState<MilestoneItem[]>([]);
  const [selected, setSelected] = useState<MilestoneItem | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDemo = useCallback(async (milestone: MilestoneKey) => {
    const res = await fetch("/api/admin/social/demo-chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestone }),
    });
    if (res.ok) {
      const json = (await res.json()) as { tweetCopy: string };
      setDemoTweetCopy(json.tweetCopy);
      setDemoChartKey((k) => k + 1);
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
    void loadDemo(demoMilestone);
  }, [demoMilestone, loadDemo]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectDemo(milestone: MilestoneKey) {
    setDemoMilestone(milestone);
    setMessage("");
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
        Tweak the chart design using the demo preview below. Live milestones appear once real Fueled
        calls hit +10%, +25%, or target.
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
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-[var(--pf-gray-600)]">
              Uses demo desk data and live Finnhub candles when available. Switch milestone badges
              to see how each variant looks before you publish for real.
            </p>
          </div>
          <Link
            href={demoChartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Open full size
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

        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--pf-border)] bg-[#0f1419] shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={demoChartKey}
            src={demoChartUrl}
            alt="Demo milestone chart preview"
            className="w-full"
          />
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Sample X post copy
          </p>
          <pre className="mt-2 max-h-36 overflow-auto rounded-lg border border-[var(--pf-border)] bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap text-[var(--pf-gray-800)]">
            {demoTweetCopy || "Loading…"}
          </pre>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">Checking live milestones…</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">
          No live Fueled calls at a milestone yet — use the demo above to refine the chart design.
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
