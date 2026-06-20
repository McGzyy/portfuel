"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  BellOff,
  BookmarkPlus,
  Keyboard,
  LayoutGrid,
  LifeBuoy,
  Megaphone,
  Moon,
  NotebookPen,
  RefreshCw,
  Sun,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaletteActionId } from "@/lib/workspace/palette-actions";

const ACTION_ICONS: Record<PaletteActionId, LucideIcon> = {
  new_call: Megaphone,
  mark_alerts_read: BellOff,
  open_alerts: Bell,
  refresh_positions: RefreshCw,
  toggle_theme: Moon,
  customize_overview: LayoutGrid,
  report: LifeBuoy,
  shortcuts: Keyboard,
  add_watchlist: BookmarkPlus,
  open_journal: NotebookPen,
  open_ticker: TrendingUp,
};

export function PaletteActionRow({
  id,
  label,
  description,
  isDark,
  dataIndex,
  active,
  onHover,
  onPick,
}: {
  id: PaletteActionId;
  label: string;
  description: string;
  isDark?: boolean;
  dataIndex: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const Icon = id === "toggle_theme" && isDark ? Sun : ACTION_ICONS[id];

  return (
    <button
      type="button"
      data-index={dataIndex}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        active ? "bg-[var(--pf-gray-100)]" : "hover:bg-[var(--pf-gray-50)]"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--pf-black)]">{label}</span>
        <span className="block truncate text-xs text-[var(--pf-gray-500)]">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
    </button>
  );
}
