"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, X } from "lucide-react";
import type { FeedFilter } from "@/lib/calls/filter-feed";
import type { FeedTab } from "@/lib/dashboard/nav";
import {
  isDefaultFeedView,
  presetHref,
  readSavedFeedPresets,
  suggestFeedPresetName,
  SAVED_FEED_PRESET_LIMIT,
  viewMatchesPreset,
  writeSavedFeedPresets,
  type SavedFeedPreset,
} from "@/lib/feed/saved-filters";
import { cn } from "@/lib/utils";

export function FeedSavedFilters({
  feedFilter,
  tab,
  searchQuery,
  showNewOnly,
}: {
  feedFilter: FeedFilter;
  tab: FeedTab;
  searchQuery: string;
  showNewOnly: boolean;
}) {
  const [presets, setPresets] = useState<SavedFeedPreset[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const view = {
    filter: feedFilter,
    tab,
    q: searchQuery,
    newSince: showNewOnly,
  };

  const loadPresets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feed/saved-views");
      if (!res.ok) {
        setPresets(readSavedFeedPresets());
        return;
      }
      const json = (await res.json()) as { presets: SavedFeedPreset[] };
      let next = json.presets ?? [];

      if (next.length === 0) {
        const local = readSavedFeedPresets();
        if (local.length > 0) {
          const mig = await fetch("/api/feed/saved-views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ presets: local }),
          });
          if (mig.ok) {
            const migrated = (await mig.json()) as { presets: SavedFeedPreset[] };
            next = migrated.presets ?? [];
            writeSavedFeedPresets([]);
          } else {
            next = local;
          }
        }
      }

      setPresets(next);
      writeSavedFeedPresets(next);
    } catch {
      setPresets(readSavedFeedPresets());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  const canSave =
    !loading &&
    !isDefaultFeedView(view) &&
    !presets.some((p) => viewMatchesPreset(p, view));

  async function saveCurrent() {
    if (presets.length >= SAVED_FEED_PRESET_LIMIT) {
      setNotice(`Max ${SAVED_FEED_PRESET_LIMIT} saved views — remove one first.`);
      return;
    }
    setNotice("");
    try {
      const res = await fetch("/api/feed/saved-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suggestFeedPresetName(view),
          filter: feedFilter,
          tab,
          q: searchQuery.trim() || undefined,
          newSince: showNewOnly || undefined,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (json.error === "duplicate") {
          setNotice("This view is already saved.");
        } else if (json.error === "limit_reached") {
          setNotice(`Max ${SAVED_FEED_PRESET_LIMIT} saved views — remove one first.`);
        } else {
          setNotice("Could not save view. Try again.");
        }
        return;
      }
      const json = (await res.json()) as { presets: SavedFeedPreset[] };
      const next = json.presets ?? [];
      setPresets(next);
      writeSavedFeedPresets(next);
      setNotice("View saved.");
      window.setTimeout(() => setNotice(""), 2500);
    } catch {
      const preset: SavedFeedPreset = {
        id: crypto.randomUUID(),
        name: suggestFeedPresetName(view),
        filter: feedFilter,
        tab,
        q: searchQuery.trim() || undefined,
        newSince: showNewOnly || undefined,
        savedAt: Date.now(),
      };
      const next = [preset, ...presets].slice(0, SAVED_FEED_PRESET_LIMIT);
      writeSavedFeedPresets(next);
      setPresets(next);
      setNotice("View saved locally (sync when online).");
      window.setTimeout(() => setNotice(""), 2500);
    }
  }

  async function removePreset(id: string) {
    try {
      const res = await fetch(`/api/feed/saved-views?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const json = (await res.json()) as { presets: SavedFeedPreset[] };
        const next = json.presets ?? [];
        setPresets(next);
        writeSavedFeedPresets(next);
        return;
      }
    } catch {
      // fall through to local remove
    }
    const next = presets.filter((p) => p.id !== id);
    writeSavedFeedPresets(next);
    setPresets(next);
  }

  if (!loading && presets.length === 0 && !canSave) return null;

  return (
    <div className="space-y-2 border-t border-[var(--pf-border)] pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Saved views
        </span>
        {canSave ? (
          <button
            type="button"
            onClick={() => void saveCurrent()}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--pf-border)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
          >
            <Bookmark className="h-3 w-3" />
            Save current
          </button>
        ) : null}
        {notice ? <span className="text-[11px] text-[var(--pf-gray-500)]">{notice}</span> : null}
      </div>
      {loading ? (
        <p className="text-[11px] text-[var(--pf-gray-400)]">Loading saved views…</p>
      ) : presets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const active = viewMatchesPreset(preset, view);
            return (
              <span key={preset.id} className="inline-flex items-center gap-0.5">
                <Link
                  href={presetHref(preset)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "pf-pill-active"
                      : "pf-pill-inactive hover:bg-[var(--pf-gray-50)]"
                  )}
                >
                  {preset.name}
                </Link>
                <button
                  type="button"
                  onClick={() => void removePreset(preset.id)}
                  className="rounded-full p-1 text-[var(--pf-gray-400)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-gray-700)]"
                  aria-label={`Remove saved view ${preset.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
