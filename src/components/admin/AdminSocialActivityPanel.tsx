"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  describePostRef,
  POST_TYPE_LABELS,
  tweetUrl,
} from "@/lib/social/post-log-labels";
import type { XPostType } from "@/lib/social/x-config";

type PublishedRow = {
  id: string;
  postType: XPostType;
  refId: string;
  tweetId: string | null;
  parentTweetId: string | null;
  postedAt: string;
};

type ActivityPayload = {
  published: PublishedRow[];
  queue: {
    memberWins: Array<{
      callId: string;
      symbol: string;
      direction: string;
      returnPct: number | null;
      status: "ready" | "waiting_sustain";
    }>;
    deskMilestones: Array<{
      callId: string;
      symbol: string;
      direction: string;
      milestone: string;
      returnPct: number | null;
    }>;
    weeklyDigest: {
      eligible: boolean;
      rowCount: number;
      alreadyPostedThisWeek: boolean;
    };
  };
};

function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminSocialActivityPanel() {
  const [data, setData] = useState<ActivityPayload | null>(null);
  const [tab, setTab] = useState<"published" | "queue">("queue");
  const [loading, setLoading] = useState(true);
  const [quoteRefresh, setQuoteRefresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social/activity");
      if (res.ok) setData((await res.json()) as ActivityPayload);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshCallQuotes() {
    setQuoteRefresh("Running…");
    try {
      const res = await fetch("/api/admin/calls/refresh-quotes", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        updated?: number;
        error?: string;
      };
      if (res.ok && json.ok) {
        setQuoteRefresh(
          `Updated ${json.updated ?? 0} call(s). Reload ticker/feed to see new returns.`
        );
        await load();
      } else {
        setQuoteRefresh(json.error === "unauthorized" ? "Admin only." : "Refresh failed.");
      }
    } catch {
      setQuoteRefresh("Refresh failed.");
    }
  }

  const readyMembers =
    data?.queue.memberWins.filter((c) => c.status === "ready").length ?? 0;
  const waitingMembers = (data?.queue.memberWins.length ?? 0) - readyMembers;

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Publishing ops
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">Activity & queue</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Review what has been published to X and what is waiting on gates, sustain timers, or cron
        flags. Dry runs are not logged here — only live posts written to{" "}
        <code className="text-xs">social_post_log</code>.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={
            tab === "queue"
              ? "rounded-full border border-[var(--pf-red)] bg-[var(--pf-red-muted)] px-3 py-1 text-xs font-bold text-[var(--pf-red)]"
              : "rounded-full border border-[var(--pf-border)] px-3 py-1 text-xs font-semibold text-[var(--pf-gray-700)]"
          }
        >
          Ready to publish
        </button>
        <button
          type="button"
          onClick={() => setTab("published")}
          className={
            tab === "published"
              ? "rounded-full border border-[var(--pf-red)] bg-[var(--pf-red-muted)] px-3 py-1 text-xs font-bold text-[var(--pf-red)]"
              : "rounded-full border border-[var(--pf-border)] px-3 py-1 text-xs font-semibold text-[var(--pf-gray-700)]"
          }
        >
          Published log
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Reload activity
        </button>
        <button
          type="button"
          onClick={() => void refreshCallQuotes()}
          className="text-xs font-semibold text-[var(--pf-gray-700)] underline-offset-2 hover:underline"
        >
          Update call prices
        </button>
      </div>
      {quoteRefresh ? (
        <p className="mt-2 text-xs text-[var(--pf-gray-600)]">{quoteRefresh}</p>
      ) : (
        <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
          Returns refresh on Vercel every 15 minutes via cron. Use{" "}
          <strong className="font-semibold text-[var(--pf-gray-600)]">Update call prices</strong>{" "}
          here (Admin → Social tab) locally or to verify a call is moving.
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">Loading…</p>
      ) : !data ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">Could not load activity.</p>
      ) : tab === "queue" ? (
        <div className="mt-6 space-y-6">
          <QueueBlock
            title="Member spotlight"
            empty="No opted-in calls in the publish pipeline."
            items={data.queue.memberWins.map((c) => ({
              key: c.callId,
              primary: `$${c.symbol} ${c.direction}`,
              meta: `${c.returnPct != null ? `${c.returnPct >= 0 ? "+" : ""}${c.returnPct.toFixed(1)}%` : "—"} · ${c.status === "ready" ? "Ready" : "Review window"}`,
              badge: c.status === "ready" ? "ready" : "waiting",
            }))}
            summary={`${readyMembers} ready · ${waitingMembers} in review window`}
          />
          <QueueBlock
            title="Desk milestones"
            empty="No unposted Fueled milestones."
            items={data.queue.deskMilestones.map((c) => ({
              key: `${c.callId}-${c.milestone}`,
              primary: `$${c.symbol} · ${c.milestone.replace(/_/g, " ")}`,
              meta: c.returnPct != null ? `${c.returnPct >= 0 ? "+" : ""}${c.returnPct.toFixed(1)}%` : "",
              badge: "ready" as const,
            }))}
          />
          <div className="rounded-lg border border-[var(--pf-border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--pf-black)]">Weekly digest</p>
            <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
              {data.queue.weeklyDigest.alreadyPostedThisWeek
                ? "Already published this week."
                : data.queue.weeklyDigest.eligible
                  ? `${data.queue.weeklyDigest.rowCount} qualifying call(s) — ready when X_POST_WEEKLY_DIGEST is on.`
                  : "Not enough qualifying calls in the last 7 days."}
            </p>
          </div>
        </div>
      ) : data.published.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">
          No live posts logged yet. Use dry run first, then publish when copy and charts look right.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pf-border)] text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                <th className="pb-2 pr-4">When</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Reference</th>
                <th className="pb-2">X</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pf-border)]">
              {data.published.map((row) => {
                const url = tweetUrl(row.tweetId);
                const parentUrl = tweetUrl(row.parentTweetId);
                return (
                  <tr key={row.id}>
                    <td className="py-3 pr-4 text-[var(--pf-gray-600)] whitespace-nowrap">
                      {fmtWhen(row.postedAt)}
                    </td>
                    <td className="py-3 pr-4 font-medium text-[var(--pf-black)]">
                      {POST_TYPE_LABELS[row.postType]}
                    </td>
                    <td className="py-3 pr-4 text-[var(--pf-gray-600)]">
                      {describePostRef(row.postType, row.refId)}
                      {parentUrl ? (
                        <span className="mt-0.5 block text-xs text-[var(--pf-gray-400)]">
                          Quote of prior post
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3">
                      {url ? (
                        <Link
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[var(--pf-red)] hover:underline"
                        >
                          View post
                        </Link>
                      ) : (
                        <span className="text-[var(--pf-gray-400)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function QueueBlock({
  title,
  empty,
  items,
  summary,
}: {
  title: string;
  empty: string;
  items: Array<{
    key: string;
    primary: string;
    meta: string;
    badge: "ready" | "waiting";
  }>;
  summary?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--pf-black)]">{title}</p>
        {summary ? <p className="text-xs text-[var(--pf-gray-500)]">{summary}</p> : null}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--pf-gray-500)]">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--pf-border)] rounded-lg border border-[var(--pf-border)]">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
            >
              <div>
                <p className="font-medium text-[var(--pf-black)]">{item.primary}</p>
                {item.meta ? (
                  <p className="text-xs text-[var(--pf-gray-500)]">{item.meta}</p>
                ) : null}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  item.badge === "ready"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-900"
                }`}
              >
                {item.badge === "ready" ? "Ready" : "Review"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
