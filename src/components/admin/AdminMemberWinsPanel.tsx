"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AdminXPostPreview,
  type AdminXPostPreviewData,
} from "@/components/admin/AdminXPostPreview";
import { formatPostError } from "@/lib/social/format-post-error";

type Candidate = {
  callId: string;
  symbol: string;
  direction: string;
  returnPct: number | null;
  username: string | null;
  displayName: string | null;
  gateAt: string;
  status: "ready" | "waiting_sustain";
};

export function AdminMemberWinsPanel() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [rulesSummary, setRulesSummary] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [postPreview, setPostPreview] = useState<AdminXPostPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/social/member-wins");
    if (!res.ok) return;
    const json = (await res.json()) as {
      candidates: Candidate[];
      rulesSummary: string;
    };
    setCandidates(json.candidates);
    setRulesSummary(json.rulesSummary);
    if (json.candidates[0] && !selectedId) {
      setSelectedId(json.candidates[0].callId);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyPreviewResponse(json: {
    text: string;
    lead?: string;
    tail?: string;
    chartUrl?: string;
    dryRun?: boolean;
    chartGenerated?: boolean;
    chartSizeBytes?: number;
  }) {
    if (!json.chartUrl) return;
    setPostPreview({
      lead: json.lead ?? json.text,
      tail: json.tail ?? "",
      text: json.text,
      chartUrl: json.chartUrl,
      cacheKey: String(Date.now()),
      chartAlt: "Member win chart",
    });
    if (json.dryRun) {
      const kb =
        json.chartSizeBytes != null ? `${Math.round(json.chartSizeBytes / 1024)} KB` : null;
      setMessage(
        json.chartGenerated
          ? `Dry run OK — chart rendered${kb ? ` (${kb})` : ""}; tweet not sent to X.`
          : "Dry run OK — copy only; chart did not render."
      );
    }
  }

  async function preview(callId: string) {
    setLoading(true);
    setMessage("");
    setSelectedId(callId);
    setPostPreview(null);
    try {
      const res = await fetch("/api/admin/social/member-wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, previewOnly: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(formatPostError(json.error as string));
        return;
      }
      applyPreviewResponse(json);
      setMessage(`Preview ready · ${json.charCount} characters`);
    } finally {
      setLoading(false);
    }
  }

  async function post(callId: string, dryRun: boolean) {
    setLoading(true);
    setMessage("");
    setSelectedId(callId);
    try {
      const res = await fetch("/api/admin/social/member-wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, dryRun, force: false }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(formatPostError(json.error as string));
        return;
      }
      if (dryRun) {
        applyPreviewResponse({ ...json, dryRun: true });
      } else {
        setMessage(`Published to X (id ${json.tweetId ?? "—"}).`);
        setPostPreview(null);
      }
      void load();
    } finally {
      setLoading(false);
    }
  }

  const selected = candidates.find((c) => c.callId === selectedId);
  const chartUrl = selectedId
    ? `/api/social/chart/${selectedId}?format=png&memberWin=1`
    : null;

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Member spotlight
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
        Performance posts · X
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Review opted-in members with calls that meet return, time-on-record, and review-window
        standards. Each publish includes a branded chart and professional copy. Enable automation
        with{" "}
        <code className="rounded bg-[var(--pf-gray-100)] px-1 py-0.5 text-xs">
          X_POST_MEMBER_WINS=true
        </code>{" "}
        after dry-run approval.
      </p>
      {rulesSummary ? (
        <p className="mt-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-xs leading-relaxed text-[var(--pf-gray-600)]">
          {rulesSummary}
        </p>
      ) : null}

      {candidates.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">
          No calls in the publish queue. Members must opt in on Settings, and calls must pass gate +
          sustain timers after quote refresh.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--pf-border)]">
          {candidates.map((c) => (
            <li
              key={c.callId}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[var(--pf-black)]">
                  ${c.symbol}{" "}
                  <span className="uppercase text-[var(--pf-gray-600)]">{c.direction}</span>
                </p>
                <p className="mt-0.5 text-sm text-[var(--pf-gray-600)]">
                  <span className="tabular-nums font-medium text-[var(--pf-black)]">
                    {c.returnPct != null
                      ? `${c.returnPct >= 0 ? "+" : ""}${c.returnPct.toFixed(1)}%`
                      : "—"}
                  </span>
                  <span className="mx-2 text-[var(--pf-gray-300)]">·</span>
                  {c.username ? `@${c.username}` : c.displayName ?? "Member"}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    c.status === "ready" ? "pf-badge-emerald" : "pf-badge-attention"
                  }`}
                >
                  {c.status === "ready" ? "Ready to publish" : "Review window"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => void preview(c.callId)}
                >
                  Preview
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading || c.status !== "ready"}
                  onClick={() => void post(c.callId, true)}
                >
                  Dry run
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={loading || c.status !== "ready"}
                  onClick={() => void post(c.callId, false)}
                >
                  Publish
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && chartUrl && !postPreview ? (
        <div className="mt-6 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Chart · ${selected.symbol}
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <a
                href={chartUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--pf-red)] hover:underline"
              >
                Open PNG
              </a>
              <a href={`${chartUrl}&download=1`} download className="text-[var(--pf-gray-700)] hover:underline">
                Download PNG
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--pf-border)] bg-[#0f1419]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${chartUrl}&t=${selected.callId}`}
              alt={`${selected.symbol} member win chart`}
              className="w-full"
            />
          </div>
        </div>
      ) : null}

      {postPreview ? (
        <div className="mt-6 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Full X post preview
          </p>
          <AdminXPostPreview preview={postPreview} />
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-[var(--pf-gray-600)]">{message}</p> : null}
    </section>
  );
}
