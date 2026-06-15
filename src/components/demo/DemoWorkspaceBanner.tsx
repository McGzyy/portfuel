import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoTierToggle } from "@/components/demo/DemoTierToggle";
import { COPY } from "@/lib/copy";
import type { DemoPreviewTier } from "@/lib/demo/tier";
import type { PreviewDataSource } from "@/lib/demo/workspace-preview";

export function DemoWorkspaceBanner({
  source,
  signedIn,
  tier,
}: {
  source?: PreviewDataSource;
  signedIn?: boolean;
  tier: DemoPreviewTier;
}) {
  const tierHint =
    tier === "pro"
      ? "Pro Intelligence preview — research terminal, deeper analytics, and faster quotes."
      : "Member preview — core workspace with upgrade prompts for Pro features.";

  return (
    <div className="border-b border-[var(--pf-border)] bg-gradient-to-r from-[var(--pf-gray-900)] to-[#1a2332] px-4 py-3 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Eye className="h-4 w-4 text-[var(--pf-red)]" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Interactive workspace preview</p>
              <p className="text-xs text-slate-300">
                Explore an active member dashboard before you join — sample book, feed, and desk
                data.
                {source === "live" ? (
                  <span className="ml-1.5 rounded bg-emerald-500/20 px-1.5 py-0.5 font-medium text-emerald-200">
                    Live community data
                  </span>
                ) : source === "sample" ? (
                  <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 font-medium text-slate-200">
                    Sample data
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DemoTierToggle tier={tier} />
            {signedIn ? (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Open your workspace
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/join">
                  <Button size="sm">{COPY.ctaGetAccess}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400 sm:pl-11">{tierHint}</p>
      </div>
    </div>
  );
}
