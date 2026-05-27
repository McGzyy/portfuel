import Link from "next/link";
import { ArrowRight, Bookmark, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTED = ["SPY", "NVDA", "AAPL", "BTC"] as const;

export function GettingStartedCard() {
  return (
    <section className="pf-workspace-panel overflow-hidden">
      <div className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Start here
        </p>
        <h2 className="mt-1 text-sm font-bold text-[var(--pf-black)]">
          Get your workspace feeling alive in 2 minutes
        </h2>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Add a few symbols, publish one thesis, and follow top callers so your feed becomes
          personalized.
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-[var(--pf-gray-500)]" />
            <p className="text-sm font-semibold text-[var(--pf-black)]">Add symbols</p>
          </div>
          <p className="mt-1.5 text-xs text-[var(--pf-gray-500)]">
            Suggested:{" "}
            <span className="font-mono font-semibold text-[var(--pf-gray-700)]">
              {SUGGESTED.join(" · ")}
            </span>
          </p>
          <Link href="/dashboard/watchlist" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-red)] hover:underline">
            Open watchlist <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[var(--pf-gray-500)]" />
            <p className="text-sm font-semibold text-[var(--pf-black)]">Publish a call</p>
          </div>
          <p className="mt-1.5 text-xs text-[var(--pf-gray-500)]">
            Your first call unlocks your track record and makes the overview meaningful.
          </p>
          <Link href="/calls/new" className="mt-3 inline-block">
            <Button size="sm">New call</Button>
          </Link>
        </div>

        <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[var(--pf-gray-500)]" />
            <p className="text-sm font-semibold text-[var(--pf-black)]">Follow callers</p>
          </div>
          <p className="mt-1.5 text-xs text-[var(--pf-gray-500)]">
            Following turns the feed into a tight list of traders you trust.
          </p>
          <Link href="/rankings" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-red)] hover:underline">
            Browse rankings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

