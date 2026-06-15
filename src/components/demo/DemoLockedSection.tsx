import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LockedVariant = "feed" | "desk" | "following";

const VARIANT_COPY: Record<
  LockedVariant,
  { title: string; subtitle: string; bullets: string[] }
> = {
  feed: {
    title: "Member feed",
    subtitle: "Verified community theses with live returns, votes, and chart markers.",
    bullets: [
      "Latest & performing lanes with filters",
      "Vote and comment on member calls",
      "Ticker pages with full thesis history",
    ],
  },
  desk: {
    title: "Fueled desk",
    subtitle: "House research lane — weekly notes, model portfolio, and official desk calls.",
    bullets: [
      "Curated PortFuel theses separate from the crowd",
      "Model portfolio with conviction & refreshed marks",
      "Desk track record and performance curve",
    ],
  },
  following: {
    title: "Following",
    subtitle: "A personalized lane for callers you track — new theses surface here first.",
    bullets: [
      "Follow from rankings or member profiles",
      "Latest theses from your watchlist",
      "Filter the main feed to people you follow",
    ],
  },
};

function SkeletonRows({ variant }: { variant: LockedVariant }) {
  const rows = variant === "desk" ? 3 : 4;
  return (
    <div className="pointer-events-none select-none space-y-2.5 px-4 py-4" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/80 px-3 py-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[var(--pf-gray-200)]" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 rounded bg-[var(--pf-gray-200)]" />
              <div className="h-2 w-28 rounded bg-[var(--pf-gray-100)]" />
            </div>
          </div>
          <div className="h-4 w-12 rounded bg-[var(--pf-gray-200)]" />
        </div>
      ))}
    </div>
  );
}

export function DemoLockedSection({
  variant,
  icon: Icon,
  className,
  compact = false,
}: {
  variant: LockedVariant;
  icon: LucideIcon;
  className?: string;
  compact?: boolean;
}) {
  const copy = VARIANT_COPY[variant];

  return (
    <section
      className={cn("pf-workspace-panel overflow-hidden", className)}
      aria-label={`${copy.title} — members only`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--pf-border)] px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pf-gray-100)] text-[var(--pf-gray-500)]">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--pf-black)]">{copy.title}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pf-gray-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--pf-gray-600)]">
                <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                Members
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-[var(--pf-gray-500)]">
              {copy.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <SkeletonRows variant={variant} />
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/55 via-white/88 to-white px-3 sm:px-4">
          <div className="max-w-sm rounded-xl border border-[var(--pf-border)] bg-white px-4 py-3.5 text-center shadow-[var(--pf-shadow-md)] sm:px-5 sm:py-4">
            <p className="text-sm font-semibold text-[var(--pf-black)]">
              Unlock with membership
            </p>
            {!compact ? (
              <ul className="mt-2.5 space-y-1 text-left text-[11px] text-[var(--pf-gray-600)]">
                {copy.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-[var(--pf-red)]">·</span>
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/join" className="mt-4 inline-block">
              <Button size="sm">Get member access</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
