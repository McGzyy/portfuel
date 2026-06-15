import Link from "next/link";
import { DemoTierToggle } from "@/components/demo/DemoTierToggle";
import { COPY } from "@/lib/copy";
import type { DemoPreviewTier } from "@/lib/demo/tier";

/** Slim preview chrome — Linear/Stripe-style, not a heavy marketing banner. */
export function DemoPreviewBar({
  tier,
  signedIn,
}: {
  tier: DemoPreviewTier;
  signedIn?: boolean;
}) {
  return (
    <div className="border-b border-[var(--pf-border)] bg-[var(--pf-surface)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pf-gray-600)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Preview
          </span>
          <DemoTierToggle tier={tier} variant="light" />
          <p className="hidden text-xs text-[var(--pf-gray-500)] sm:block">
            {tier === "pro"
              ? "Pro Intelligence layout — your book uses sample data; community & desk unlock after join."
              : "Member layout — sample book & watchlist; feed, desk, and Pro research unlock after join."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[var(--pf-gray-700)] hover:text-[var(--pf-black)] hover:underline"
            >
              Your workspace →
            </Link>
          ) : (
            <Link
              href="/join"
              className="rounded-lg bg-[var(--pf-red)] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[var(--pf-red-hover)]"
            >
              {COPY.ctaGetAccess}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
