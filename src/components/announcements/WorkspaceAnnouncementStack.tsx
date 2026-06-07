"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { SiteAnnouncement } from "@/lib/announcements/types";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<
  SiteAnnouncement["severity"],
  { wrap: string; title: string; body: string }
> = {
  info: {
    wrap: "border-slate-200/80 bg-slate-50 text-slate-950",
    title: "text-slate-950",
    body: "text-slate-800",
  },
  warning: {
    wrap: "border-amber-200/80 bg-amber-50 text-amber-950",
    title: "text-amber-950",
    body: "text-amber-900/90",
  },
  success: {
    wrap: "border-emerald-200/80 bg-emerald-50 text-emerald-950",
    title: "text-emerald-950",
    body: "text-emerald-900/90",
  },
};

export function WorkspaceAnnouncementStack({
  announcements,
}: {
  announcements: SiteAnnouncement[];
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visible = announcements.filter((a) => !hidden.has(a.id));
  if (visible.length === 0) return null;

  async function dismiss(id: string) {
    setHidden((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/announcements/${id}/dismiss`, { method: "POST" });
    } catch {
      /* optimistic hide */
    }
  }

  return (
    <div className="space-y-0 border-b border-[var(--pf-border)]">
      {visible.map((item) => {
        const styles = SEVERITY_STYLES[item.severity];
        return (
          <div
            key={item.id}
            role="status"
            className={cn("relative px-4 py-3 sm:px-6", styles.wrap, "border-b last:border-b-0")}
          >
            <div className="flex items-start gap-3 pr-8">
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", styles.title)}>{item.title}</p>
                <p className={cn("mt-0.5 text-sm leading-relaxed", styles.body)}>{item.body}</p>
                {item.link_url ? (
                  <Link
                    href={item.link_url}
                    className="mt-2 inline-block text-sm font-semibold text-[var(--pf-red)] hover:underline"
                  >
                    {item.link_label ?? "Learn more"} →
                  </Link>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="absolute right-3 top-3 rounded-lg p-1 text-[var(--pf-gray-500)] hover:bg-black/5"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
