import Link from "next/link";
import { ArrowRight, BookOpen, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatPct } from "@/lib/utils";

/** Landing hero — mirrors /demo overview; links into interactive preview (no paid content). */
export function HeroDashboardMock() {
  return (
    <Link
      href="/demo"
      className="pf-mock-frame group relative mx-auto block w-full max-w-md lg:max-w-none"
    >
      <div
        className="absolute -inset-4 rounded-3xl bg-[var(--pf-red)]/10 blur-2xl transition-opacity group-hover:opacity-90"
        aria-hidden
      />
      <div className="pf-mock-panel relative overflow-hidden transition-shadow group-hover:shadow-[var(--pf-shadow-lg)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--pf-border)] bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--pf-gray-600)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Preview
            </span>
            <span className="inline-flex rounded-md border border-[var(--pf-border)] bg-white p-0.5 text-[9px] font-bold">
              <span className="rounded px-1.5 py-0.5 text-[var(--pf-black)]">Member</span>
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[var(--pf-gray-400)]">
                <Sparkles className="h-2.5 w-2.5" />
                Pro
              </span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pf-red)] group-hover:underline">
            Try it
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </span>
        </div>

        <div className="border-b border-[var(--pf-border)] px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]">
            Your workspace
          </p>
          <p className="mt-0.5 text-sm font-bold text-[var(--pf-black)]">Good evening, Alex</p>
          <p className="mt-1 text-[10px] text-[var(--pf-gray-500)]">
            2 active calls · 1 awaiting entry on your book
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 border-b border-[var(--pf-border)] px-4 py-3">
          <HeroStat label="Return" value="+9.5%" accent="up" />
          <HeroStat label="Win rate" value="67%" />
          <HeroStat label="Calls/wk" value="2/6" />
          <HeroStat label="Rank" value="212" />
        </div>

        <div className="space-y-2 p-4">
          <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            <BookOpen className="h-3 w-3" strokeWidth={2.25} />
            Your open calls (sample)
          </p>
          <SampleBookRow symbol="NVDA" direction="long" returnPct={6.35} />
          <SampleBookRow symbol="BTC" direction="long" returnPct={3.18} crypto />
        </div>

        <div className="relative border-t border-[var(--pf-border)] bg-[var(--pf-gray-50)]/80 px-4 py-3">
          <div className="space-y-2 opacity-40 blur-[1px]" aria-hidden>
            <div className="h-8 rounded border border-[var(--pf-border)] bg-white" />
            <div className="h-8 rounded border border-[var(--pf-border)] bg-white" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-4">
            <Lock className="h-3 w-3 text-[var(--pf-gray-500)]" strokeWidth={2.5} />
            <span className="text-[10px] font-semibold text-[var(--pf-gray-600)]">
              Member feed & Fueled desk unlock after join
            </span>
          </div>
        </div>

        <div className="border-t border-[var(--pf-border)] bg-white px-4 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-[var(--pf-gray-600)] group-hover:text-[var(--pf-red)]">
            Interactive workspace preview — toggle Member vs Pro
          </p>
        </div>
      </div>
    </Link>
  );
}

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/80 px-1.5 py-1.5 text-center">
      <p className="text-[8px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xs font-bold tabular-nums",
          accent === "up"
            ? "text-emerald-600"
            : accent === "down"
              ? "text-rose-600"
              : "text-[var(--pf-black)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SampleBookRow({
  symbol,
  direction,
  returnPct,
  crypto,
}: {
  symbol: string;
  direction: "long" | "short";
  returnPct: number;
  crypto?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 shadow-[var(--pf-shadow-sm)]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-bold text-[var(--pf-black)]">{symbol}</span>
        <Badge variant={direction === "long" ? "long" : "short"} className="text-[9px]">
          {direction}
        </Badge>
        {crypto ? (
          <Badge variant="default" className="text-[9px]">
            Crypto
          </Badge>
        ) : null}
      </div>
      <span className="text-sm font-bold tabular-nums text-emerald-600">{formatPct(returnPct)}</span>
    </div>
  );
}
