"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import type { FueledIntelLayers } from "@/lib/ai/fueled-intel-types";

type Snapshot = {
  tweet_url?: string | null;
  mode?: string | null;
  research_pack?: {
    headlines?: Array<{ headline: string; source: string; url: string }>;
    intelLayers?: FueledIntelLayers;
  };
  cost?: { estimatedCostUsd?: number; modelId?: string };
};

function IntelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 border-t border-[var(--pf-border)] pt-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {title}
      </p>
      <div className="mt-1.5 space-y-1 text-xs text-[var(--pf-gray-600)]">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-[var(--pf-gray-500)]">—</p>;
  return (
    <ul className="list-inside list-disc space-y-0.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function CallResearchExpand({ callId }: { callId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");

  async function load() {
    if (snap) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/calls/${encodeURIComponent(callId)}/research`);
      const json = await res.json();
      if (!res.ok) {
        setError("Research unavailable.");
        setOpen(true);
        return;
      }
      setSnap(json.snapshot as Snapshot);
      setOpen(true);
    } catch {
      setError("Research unavailable.");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  const headlines = snap?.research_pack?.headlines ?? [];
  const intel = snap?.research_pack?.intelLayers;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-red)]"
      >
        <Newspaper className="h-3 w-3" />
        {loading ? "Loading…" : open && snap ? "Hide research" : "Research"}
      </button>

      {open && snap ? (
        <div className="mt-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Sources {snap.mode ? `· ${snap.mode}` : ""}
            {intel ? " · 4-step AI" : ""}
          </p>
          {snap.tweet_url ? (
            <a
              href={snap.tweet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              View original post
            </a>
          ) : null}

          {intel ? (
            <>
              <IntelSection title="Headlines intel">
                <p>
                  Sentiment: <span className="font-medium capitalize">{intel.headlines.sentiment}</span>
                </p>
                <BulletList items={intel.headlines.headlineTakeaways} />
              </IntelSection>
              <IntelSection title="Fundamentals intel">
                {intel.fundamentals.earningsContext ? (
                  <p>{intel.fundamentals.earningsContext}</p>
                ) : null}
                {intel.fundamentals.filingContext ? (
                  <p className="mt-1">{intel.fundamentals.filingContext}</p>
                ) : null}
                <BulletList items={intel.fundamentals.eventRisk} />
              </IntelSection>
              <IntelSection title="Tape / setup">
                <BulletList items={intel.tape.setup} />
                <p className="mt-1 italic">{intel.tape.postSignal}</p>
              </IntelSection>
            </>
          ) : null}

          {headlines.length > 0 ? (
            <div className={intel ? "mt-3 border-t border-[var(--pf-border)] pt-2" : "mt-2"}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Raw headlines
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {headlines.map((h) => (
                  <li key={h.url} className="text-xs">
                    <a
                      href={h.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--pf-red)] hover:underline"
                    >
                      {h.headline}
                    </a>
                    <span className="text-[var(--pf-gray-500)]"> · {h.source}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : !intel ? (
            <p className="mt-2 text-xs text-[var(--pf-gray-500)]">No sources recorded.</p>
          ) : null}

          {snap.cost?.estimatedCostUsd != null ? (
            <p className="mt-2 text-[10px] text-[var(--pf-gray-400)]">
              est ${snap.cost.estimatedCostUsd} · {snap.cost.modelId ?? "model"}
            </p>
          ) : null}
        </div>
      ) : null}

      {open && error ? (
        <p className="mt-2 text-xs text-[var(--pf-gray-600)]">{error}</p>
      ) : null}
    </div>
  );
}
