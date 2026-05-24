import Link from "next/link";
import { Radio, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export function MembersFeedGate() {
  return (
    <section className="border-y border-[var(--pf-border)] bg-[var(--pf-black)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--pf-red)]">
              {COPY.membersOnly}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              The live intel stays behind the member wall
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Fresh theses, entry levels, and the full dashboard are for paid members. The homepage
              only showcases calls that have already hit performance thresholds — never the live
              board or full write-ups.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/join">
                <Button size="lg">{COPY.ctaGetAccess}</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
          <div className="pf-card rounded-[var(--pf-radius-lg)] border-white/10 bg-white/5 p-6 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Radio className="h-4 w-4 text-[var(--pf-red)]" />
              Live board (locked)
            </div>
            <ul className="mt-4 space-y-3">
              {["Real-time latest calls", "Full thesis + levels", "Vote & comment", "Submit your own calls"].map(
                (item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/80"
                  >
                    <Lock className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
