import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

/** Join funnel — ties checkout to the interactive /demo preview. */
export function JoinDemoPreviewStrip() {
  return (
    <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--pf-red)] shadow-[var(--pf-shadow-sm)]">
          <LayoutDashboard className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--pf-black)]">
            Explored the workspace preview?
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--pf-gray-600)]">
            At <span className="font-medium">/demo</span> you can toggle{" "}
            <strong className="font-semibold text-[var(--pf-black)]">Member vs Pro</strong> and walk
            your sample book. Choosing a plan here unlocks the member feed, Fueled desk, and
            publishing.
          </p>
        </div>
      </div>
      <Link
        href="/demo"
        className="mt-3 inline-flex shrink-0 items-center justify-center rounded-lg border border-[var(--pf-border)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--pf-black)] hover:bg-[var(--pf-gray-100)] sm:mt-0"
      >
        Open preview →
      </Link>
    </div>
  );
}
