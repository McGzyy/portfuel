"use client";

import { TradeSetupPreview } from "@/components/calls/TradeSetupPreview";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

function snippet(text: string, max = 280): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function JournalPublishPreview({
  symbol,
  direction,
  thesis,
  entryPrice,
  targetPrice,
  stopPrice,
  timeframeTag,
  conviction,
  catalysts,
  contextNotes,
}: {
  symbol: string;
  direction: "long" | "short";
  thesis: string;
  entryPrice: string;
  targetPrice: string;
  stopPrice: string;
  timeframeTag: string;
  conviction?: string;
  catalysts?: string[];
  contextNotes?: string;
}) {
  const sym = symbol.trim().toUpperCase();
  if (!sym || !thesis.trim()) return null;

  const convictionNum = conviction ? parseInt(conviction, 10) : null;

  return (
    <section
      className="mb-6 overflow-hidden rounded-[var(--pf-radius-lg)] border border-indigo-200 bg-white shadow-[var(--pf-shadow-sm)]"
      aria-label="Community preview"
    >
      <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-800">
          What the community will see
        </p>
        <p className="mt-1 text-xs text-indigo-900/80">
          Prefilled from your private journal — edit anything below before publishing.
        </p>
      </div>

      <div
        className={cn(
          "border-l-4 px-4 py-4 sm:px-5",
          direction === "long" ? "border-l-emerald-500" : "border-l-rose-500"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-bold text-[var(--pf-black)]">{sym}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              direction === "long"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            )}
          >
            {direction}
          </span>
          {convictionNum != null && convictionNum >= 1 && convictionNum <= 10 ? (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
              {convictionNum}/10 conviction
            </span>
          ) : null}
          {timeframeTag.trim() ? (
            <span className="rounded-full bg-[var(--pf-gray-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--pf-gray-600)]">
              {timeframeTag.trim()}
            </span>
          ) : null}
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--pf-gray-800)]">
          {snippet(thesis)}
        </p>

        {(entryPrice || targetPrice || stopPrice) && (
          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-[var(--pf-gray-600)]">
            {entryPrice ? (
              <div>
                <dt className="inline font-semibold text-[var(--pf-gray-500)]">Entry </dt>
                <dd className="inline font-mono font-bold text-[var(--pf-black)]">
                  ${formatPrice(parseFloat(entryPrice))}
                </dd>
              </div>
            ) : null}
            {targetPrice ? (
              <div>
                <dt className="inline font-semibold text-[var(--pf-gray-500)]">Target </dt>
                <dd className="inline font-mono font-bold text-emerald-700">
                  ${formatPrice(parseFloat(targetPrice))}
                </dd>
              </div>
            ) : null}
            {stopPrice ? (
              <div>
                <dt className="inline font-semibold text-[var(--pf-gray-500)]">Stop </dt>
                <dd className="inline font-mono font-bold text-rose-700">
                  ${formatPrice(parseFloat(stopPrice))}
                </dd>
              </div>
            ) : null}
          </dl>
        )}

        {catalysts && catalysts.length > 0 ? (
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

        {contextNotes?.trim() ? (
          <p className="mt-3 rounded-lg bg-[var(--pf-gray-50)] px-3 py-2 text-[11px] leading-relaxed text-[var(--pf-gray-600)]">
            <span className="font-semibold text-[var(--pf-gray-500)]">Private context (not published): </span>
            {snippet(contextNotes, 200)}
          </p>
        ) : null}

        <div className="mt-4">
          <TradeSetupPreview
            direction={direction}
            entryPrice={entryPrice}
            targetPrice={targetPrice}
            stopPrice={stopPrice}
          />
        </div>
      </div>
    </section>
  );
}
