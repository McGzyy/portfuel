"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, Cloud, CloudOff, X } from "lucide-react";
import type { FeedFilter } from "@/lib/calls/filter-feed";
import type { FeedTab } from "@/lib/dashboard/nav";
import {
  isDefaultFeedView,
  presetHref,
  readSavedFeedPresets,
  savedFeedPresetSummary,
  suggestFeedPresetName,
  SAVED_FEED_PRESET_LIMIT,
  viewMatchesPreset,
  writeSavedFeedPresets,
  type SavedFeedPreset,
} from "@/lib/feed/saved-filters";
import { cn } from "@/lib/utils";

type SyncSource = "cloud" | "local" | null;

type NoticeTone = "neutral" | "success" | "error";

function noticeClass(tone: NoticeTone): string {
  if (tone === "success") return "text-emerald-600";
  if (tone === "error") return "text-rose-600";
  return "text-[var(--pf-gray-500)]";
}

function savedViewsErrorMessage(code: string | undefined): string {
  switch (code) {
    case "duplicate":
      return "This view is already saved.";
    case "limit_reached":
      return `Max ${SAVED_FEED_PRESET_LIMIT} saved views — remove one first.`;
    case "unauthorized":
      return "Sign in again to sync saved views.";
    case "subscription_inactive":
      return "Active membership required to sync saved views.";
    case "service_unavailable":
      return "Cloud sync is unavailable — using this device only.";
    default:
      return "Could not save view. Try again.";
  }
}

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
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("neutral");
  const [loading, setLoading] = useState(true);
  const [syncSource, setSyncSource] = useState<SyncSource>(null);

  const view = {
    filter: feedFilter,
    tab,
    q: searchQuery,
    newSince: showNewOnly,
  };

  const showNotice = useCallback((message: string, tone: NoticeTone = "neutral") => {
    setNotice(message);
    setNoticeTone(tone);
    if (tone !== "error") {
      window.setTimeout(() => setNotice(""), 2800);
    }
  }, []);

  const loadPresets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feed/saved-views");
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setPresets(readSavedFeedPresets());
        setSyncSource(readSavedFeedPresets().length > 0 ? "local" : null);
        if (json.error === "service_unavailable") {
          showNotice(savedViewsErrorMessage(json.error), "error");
        }
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
            showNotice("Saved views synced to your account.", "success");
          } else {
            next = local;
            setSyncSource("local");
          }
        }
      }

      setPresets(next);
      writeSavedFeedPresets(next);
      setSyncSource("cloud");
    } catch {
      const local = readSavedFeedPresets();
      setPresets(local);
      setSyncSource(local.length > 0 ? "local" : null);
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  const canSave =
    !loading &&
    !isDefaultFeedView(view) &&
    !presets.some((p) => viewMatchesPreset(p, view));

  const atLimit = presets.length >= SAVED_FEED_PRESET_LIMIT;

  async function saveCurrent() {
    if (atLimit) {
      showNotice(savedViewsErrorMessage("limit_reached"), "error");
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
        showNotice(savedViewsErrorMessage(json.error), "error");
        return;
      }
      const json = (await res.json()) as { presets: SavedFeedPreset[] };
      const next = json.presets ?? [];
      setPresets(next);
      writeSavedFeedPresets(next);
      setSyncSource("cloud");
      showNotice("View saved to your account.", "success");
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
      setSyncSource("local");
      showNotice("View saved on this device only (offline).", "neutral");
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
        setSyncSource("cloud");
        return;
      }
    } catch {
      // fall through to local remove
    }
    const next = presets.filter((p) => p.id !== id);
    writeSavedFeedPresets(next);
    setPresets(next);
    if (syncSource === "cloud") setSyncSource("local");
  }

  return (
    <div className="space-y-2 sm:space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Saved views
          </span>
          {!loading ? (
            <span className="text-[10px] tabular-nums text-[var(--pf-gray-400)]">
              {presets.length}/{SAVED_FEED_PRESET_LIMIT}
            </span>
          ) : null}
          {syncSource === "cloud" ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600"
              title="Synced across your devices"
            >
              <Cloud className="h-3 w-3" aria-hidden />
              Synced
            </span>
          ) : syncSource === "local" ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700"
              title="Stored on this device until cloud sync works"
            >
              <CloudOff className="h-3 w-3" aria-hidden />
              This device
            </span>
          ) : null}
        </div>
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
        {notice ? (
          <span className={cn("text-[11px]", noticeClass(noticeTone))}>{notice}</span>
        ) : null}
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
                  title={savedFeedPresetSummary(preset)}
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
      ) : (
        <p className="hidden text-[11px] text-[var(--pf-gray-500)] sm:block">
          {isDefaultFeedView(view)
            ? "Change tab, filter, or search — then save a combo for one-click access on any device."
            : atLimit
              ? `Remove a saved view to add “${suggestFeedPresetName(view)}”.`
              : "No saved views yet — use Save current to keep this filter combo."}
        </p>
      )}
    </div>
  );
}
