import Link from "next/link";
import { ArrowRight, Megaphone, Sparkles } from "lucide-react";
import type { JournalNextUp } from "@/lib/journal/next-up";
import { cn } from "@/lib/utils";

export function JournalContinueCard({ nextUp }: { nextUp: JournalNextUp }) {
  const isPublish = nextUp.reason === "publish_call";
  const isPosture = nextUp.reason === "manage_posture";

  return (
    <Link
      href={nextUp.href}
      className={cn(
        "group block rounded-[var(--pf-radius-lg)] border px-5 py-4 shadow-[var(--pf-shadow-sm)] transition-colors",
        isPublish ? "pf-ready-publish-nudge" : isPosture ? "pf-posture-nudge" : "pf-continue-card"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
              isPublish ? "text-emerald-800" : isPosture ? "text-amber-800" : "text-[var(--pf-red)]"
            )}
          >
            {isPublish ? (
              <Megaphone className="h-3.5 w-3.5" strokeWidth={2.25} />
            ) : (
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
            {isPublish
              ? "Ready to publish"
              : isPosture
                ? "Book posture"
                : "Up next in your journal"}
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-[var(--foreground)]">{nextUp.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-600)]">{nextUp.detail}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
            isPublish
              ? "bg-emerald-700 text-white group-hover:bg-emerald-800"
              : "pf-accent-btn"
          )}
        >
          {nextUp.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}
