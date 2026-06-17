"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { DiscordMessagePreview } from "@/components/admin/DiscordMessagePreview";
import type { DiscordPreviewItem } from "@/lib/discord/admin-previews";
import { cn } from "@/lib/utils";

type PreviewSection = {
  id: string;
  title: string;
  description: string;
  items: DiscordPreviewItem[];
};

function chartPreviewUrl(item: DiscordPreviewItem): string | undefined {
  if (!item.attachChart) return undefined;
  const params = new URLSearchParams({ k: String(Date.now()) });
  if (item.chartWeeklyDigest) return `/api/admin/social/weekly-digest/chart?${params.toString()}`;
  if (item.chartMemberWin) params.set("memberWin", "1");
  else if (item.chartMilestone) params.set("milestone", item.chartMilestone);
  return `/api/admin/social/demo-chart?${params.toString()}`;
}

export function AdminDiscordPanel() {
  const [sections, setSections] = useState<PreviewSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("calls");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/discord/previews");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "unauthorized" ? "Admin session required." : "Could not load previews.");
        setSections([]);
        return;
      }
      const next = Array.isArray(json.sections) ? (json.sections as PreviewSection[]) : [];
      setSections(next);
      if (next.length) {
        setActiveSection((prev) => (next.some((s) => s.id === prev) ? prev : next[0].id));
      }
    } catch {
      setError("Could not load previews.");
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const section = sections.find((s) => s.id === activeSection);

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        group="Social & growth"
        title="Discord bot posts"
        description="Visual previews of every automatic PortFuel bot message — call alerts, pinned hubs, community posts, and staff channels. Live Discord matches these layouts after deploy."
        footer={
          <p className="text-xs text-[var(--pf-gray-500)]">
            Hub pins refresh when you restart the droplet bot. Call and staff alerts fire on real
            events.
          </p>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--pf-gray-400)]" />
        </div>
      ) : error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeSection === s.id
                    ? "bg-[var(--pf-black)] text-white"
                    : "border border-[var(--pf-border)] bg-white text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>

          {section ? (
            <div className="space-y-6">
              <p className="text-sm text-[var(--pf-gray-600)]">{section.description}</p>
              <div className="grid gap-8 xl:grid-cols-2">
                {section.items.map((item) => (
                  <article key={item.id} className="space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--foreground)]">{item.label}</h3>
                      <p className="mt-1 font-mono text-[11px] text-[var(--pf-gray-500)]">
                        {item.channel} · {item.eventType}
                      </p>
                    </div>
                    <DiscordMessagePreview
                      content={item.content}
                      embeds={item.embeds}
                      attachChart={item.attachChart}
                      chartUrl={chartPreviewUrl(item)}
                      note={item.note}
                    />
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
