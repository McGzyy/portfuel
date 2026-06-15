import Link from "next/link";
import {
  BookOpen,
  Flame,
  LayoutGrid,
  Lock,
  Notebook,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import type { DemoPreviewTier } from "@/lib/demo/tier";
import { cn } from "@/lib/utils";

type Tile = {
  label: string;
  detail: string;
  href: string;
  icon: typeof BookOpen;
  state: "active" | "locked" | "pro";
};

export function DemoCapabilityGrid({ tier }: { tier: DemoPreviewTier }) {
  const isPro = tier === "pro";

  const tiles: Tile[] = [
    {
      label: "Your book",
      detail: "Sample open calls & track record",
      href: "/demo",
      icon: BookOpen,
      state: "active",
    },
    {
      label: "Watchlist",
      detail: "Symbols, alerts & journal",
      href: "/demo",
      icon: Star,
      state: "active",
    },
    {
      label: "Member feed",
      detail: "Community theses & votes",
      href: "/demo/feed",
      icon: LayoutGrid,
      state: "locked",
    },
    {
      label: "Fueled desk",
      detail: "House research & portfolio",
      href: "/demo/desk",
      icon: Flame,
      state: "locked",
    },
    {
      label: "Research hub",
      detail: isPro ? "Screener, earnings & intel" : "Pro Intelligence",
      href: isPro ? "/join" : "/join",
      icon: Sparkles,
      state: isPro ? "active" : "pro",
    },
    {
      label: "Rankings",
      detail: "Leaderboard & follow callers",
      href: "/demo/rankings",
      icon: Trophy,
      state: "active",
    },
  ];

  return (
    <section className="pf-workspace-panel p-4 sm:p-5" aria-label="Workspace capabilities">
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          What you get
        </p>
        <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
          Walk the workspace layout — member-only lanes stay gated in preview.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className={cn(
                "group rounded-xl border px-3 py-3 transition-colors sm:px-4 sm:py-3.5",
                tile.state === "active"
                  ? "border-[var(--pf-border)] bg-white hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]"
                  : tile.state === "pro"
                    ? "border-sky-200/80 bg-sky-50/50 hover:bg-sky-50"
                    : "border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 hover:bg-[var(--pf-gray-50)]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    tile.state === "active"
                      ? "text-[var(--pf-red)]"
                      : tile.state === "pro"
                        ? "text-sky-600"
                        : "text-[var(--pf-gray-400)]"
                  )}
                  strokeWidth={2.25}
                />
                {tile.state === "locked" ? (
                  <Lock className="h-3 w-3 text-[var(--pf-gray-400)]" strokeWidth={2.5} />
                ) : tile.state === "pro" ? (
                  <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-800">
                    Pro
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs font-bold text-[var(--pf-black)] group-hover:text-[var(--pf-red)]">
                {tile.label}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-[var(--pf-gray-500)]">
                {tile.detail}
              </p>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--pf-gray-500)]">
        <Notebook className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        Journal & DMs follow the same workspace shell after join.
      </p>
    </section>
  );
}
