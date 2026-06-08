import Link from "next/link";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown to admins when community feed data is still sparse. */
export function AdminCommunityHint({ className }: { className?: string }) {
  return (
    <section
      className={
        className ??
        "rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-surface-muted)] px-5 py-4"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pf-surface)] shadow-[var(--pf-shadow-sm)]">
            <Sprout className="h-4 w-4 text-[var(--pf-positive)]" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--pf-black)]">
              Early days — you shape how alive this feels
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-600)]">
              Publish Fueled desk theses and a weekly note, then invite a few founding members. The
              feed and hot tickers fill as real calls land. Checklist in Admin → Launch.
            </p>
          </div>
        </div>
        <Link href="/admin?tab=launch" className="shrink-0">
          <Button variant="outline" size="sm">
            Launch checklist
          </Button>
        </Link>
      </div>
    </section>
  );
}
