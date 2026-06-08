"use client";

import { useMemo } from "react";
import { CallCard, type CallCardData } from "@/components/calls/CallCard";
import { normalizeCallCardPrices } from "@/lib/calls/card-display";
import { computeReturnPct } from "@/lib/scoring/returns";
import type { HeaderUser } from "@/lib/auth/session-user";
import { cn } from "@/lib/utils";

function parsePrice(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function snippet(text: string, max = 200): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function PublishCallCardPreview({
  user,
  symbol,
  assetClass,
  direction,
  thesis,
  entryPrice,
  targetPrice,
  stopPrice,
  timeframeTag,
  lastPrice,
  publishFueled = false,
  fromJournal = false,
  conviction,
  catalysts,
  contextNotes,
  className,
}: {
  user: HeaderUser;
  symbol: string;
  assetClass: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  entryPrice: string;
  targetPrice: string;
  stopPrice: string;
  timeframeTag: string;
  lastPrice?: number | null;
  publishFueled?: boolean;
  fromJournal?: boolean;
  conviction?: string;
  catalysts?: string[];
  contextNotes?: string;
  className?: string;
}) {
  const sym = symbol.trim().toUpperCase();
  const trimmedThesis = thesis.trim();
  const showPreview = sym.length > 0 && trimmedThesis.length >= 10;

  const call = useMemo((): CallCardData | null => {
    if (!showPreview) return null;

    const entry = parsePrice(entryPrice);
    const target = parsePrice(targetPrice);
    const stop = parsePrice(stopPrice);
    const prices = normalizeCallCardPrices({
      direction,
      entry_price: entry,
      price_at_call: entry,
      target_price: target,
      stop_price: stop,
      last_price: lastPrice ?? null,
      target_progress: null,
    });

    const basis = entry ?? lastPrice ?? null;
    const return_pct =
      basis != null && lastPrice != null
        ? computeReturnPct({ direction, basisPrice: basis, lastPrice })
        : null;

    return {
      id: "publish-preview",
      user_id: "preview",
      symbol: sym,
      asset_class: assetClass,
      direction,
      thesis: trimmedThesis,
      called_at: new Date().toISOString(),
      return_pct,
      ...prices,
      timeframe_tag: timeframeTag.trim() || null,
      is_fueled: publishFueled,
      vote_score: 0,
      comment_count: 0,
      display_name: user.displayName,
      pin: user.username,
      username: user.username,
    };
  }, [
    sym,
    assetClass,
    direction,
    trimmedThesis,
    entryPrice,
    targetPrice,
    stopPrice,
    timeframeTag,
    lastPrice,
    publishFueled,
    user.displayName,
    user.username,
    showPreview,
  ]);

  const convictionNum = conviction ? parseInt(conviction, 10) : null;

  if (!showPreview || !call) return null;

  return (
    <section
      className={cn(
        "mb-6 overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] shadow-[var(--pf-shadow-sm)]",
        className
      )}
      aria-label="Live feed preview"
    >
      <div className="border-b border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 py-3 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-500)]">
          Live feed preview
        </p>
        <p className="mt-1 text-xs text-[var(--pf-gray-600)]">
          {fromJournal
            ? "How your call will appear on the member feed — prefilled from your journal, updates as you edit."
            : "How your call will appear on the member feed — updates as you edit."}
        </p>
      </div>

      <div className="p-4 sm:p-5">
        {fromJournal &&
        convictionNum != null &&
        convictionNum >= 1 &&
        convictionNum <= 10 ? (
          <p className="mb-3">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
              {convictionNum}/10 conviction · private until publish
            </span>
          </p>
        ) : null}

        <CallCard call={call} compact showSummary={false} interactive={false} />

        {fromJournal && catalysts && catalysts.length > 0 ? (
          <p className="mt-3 flex flex-wrap gap-1">
            {catalysts.map((c) => (
              <span
                key={c}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 ring-1 ring-indigo-100"
              >
                {c}
              </span>
            ))}
          </p>
        ) : null}

        {fromJournal && contextNotes?.trim() ? (
          <p className="mt-3 rounded-lg border border-dashed border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-2 text-[11px] leading-relaxed text-[var(--pf-gray-600)]">
            <span className="font-semibold text-[var(--pf-gray-500)]">
              Private context (not published):{" "}
            </span>
            {snippet(contextNotes)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
