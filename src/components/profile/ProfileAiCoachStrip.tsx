import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { AiCoachUsageStatus } from "@/lib/ai/usage";
import { AI_COACH_MONTHLY_LIMIT } from "@/lib/ai/config";
import { COPY } from "@/lib/copy";

export function ProfileAiCoachStrip({ usage }: { usage: AiCoachUsageStatus }) {
  const tierLabel = usage.tier === "pro" ? "Pro Intelligence" : "Member";

  return (
    <section className="pf-workspace-panel flex flex-wrap items-start gap-4 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
        <Sparkles className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          AI thesis coach
        </p>
        <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
          {usage.remaining} of {usage.limit} reviews left this month ({tierLabel}). Educational
          feedback on structure and risk — not investment advice.
        </p>
        {!usage.configured ? (
          <p className="mt-2 text-xs text-amber-800">
            OpenAI is not configured in this environment — coach runs in demo mode.
          </p>
        ) : null}
        {usage.tier !== "pro" && usage.remaining === 0 ? (
          <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
            Member limit is {AI_COACH_MONTHLY_LIMIT.member}/month.{" "}
            <Link href="/profile" className="font-semibold text-[var(--pf-red)] hover:underline">
              Upgrade to Pro
            </Link>{" "}
            for {AI_COACH_MONTHLY_LIMIT.pro}/month and track-record context.
          </p>
        ) : null}
      </div>
      <Link
        href={COPY.newCallHref}
        className="shrink-0 text-sm font-semibold text-[var(--pf-red)] hover:underline"
      >
        {COPY.newCall} →
      </Link>
    </section>
  );
}
