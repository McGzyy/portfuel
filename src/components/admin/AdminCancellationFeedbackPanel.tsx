"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  cancellationReasonLabel,
  type CancellationFeedbackWithUser,
} from "@/lib/billing/cancellation-feedback-types";
import { cn, timeAgo } from "@/lib/utils";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sourceLabel(source: CancellationFeedbackWithUser["source"]) {
  if (source === "pre_portal") return "Before Stripe";
  if (source === "post_portal") return "After Stripe";
  return "Webhook";
}

export function AdminCancellationFeedbackPanel() {
  const [items, setItems] = useState<CancellationFeedbackWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cancellation-feedback");
      if (!res.ok) throw new Error("fetch_failed");
      const json = (await res.json()) as { feedback: CancellationFeedbackWithUser[] };
      setItems(json.feedback);
    } catch {
      setError("Could not load cancellation feedback.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mt-8 space-y-6">
      <section className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Churn
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">Cancellation feedback</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Optional reasons members share when cancelling. Admins also receive email and in-app
          alerts when feedback is submitted.
        </p>
      </section>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <section className="pf-workspace-panel overflow-hidden">
        <div className="border-b border-[var(--pf-border)] px-5 py-4">
          <h3 className="text-sm font-bold text-[var(--pf-black)]">
            {loading ? "Loading…" : `${items.length} response${items.length === 1 ? "" : "s"}`}
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--pf-gray-500)]">
            No cancellation feedback yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--pf-border)]">
            {items.map((item) => {
              const memberLabel = item.display_name?.trim() || item.username;
              return (
                <li key={item.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/members/${item.user_id}`}
                          className="text-sm font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)] hover:underline"
                        >
                          {memberLabel}
                        </Link>
                        <span className="text-xs text-[var(--pf-gray-400)]">@{item.username}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            item.membership_tier === "pro"
                              ? "bg-violet-100 text-violet-800"
                              : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]"
                          )}
                        >
                          {item.membership_tier ?? "unknown"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-[var(--pf-black)]">
                        {cancellationReasonLabel(item.reason)}
                      </p>
                      {item.comment ? (
                        <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)]">
                          {item.comment}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-[var(--pf-gray-400)]">
                        {sourceLabel(item.source)} · Status {item.subscription_status}
                        {item.billing_interval ? ` · ${item.billing_interval}` : ""}
                        {item.email ? ` · ${item.email}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-[var(--pf-gray-400)]">
                      <p title={formatWhen(item.created_at)}>{timeAgo(item.created_at)}</p>
                      {item.admin_notified_at ? (
                        <p className="mt-1 text-emerald-700">Admins notified</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
