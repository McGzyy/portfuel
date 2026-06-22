import Link from "next/link";
import { LifeBuoy, MessageSquare } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";

export function HelpContextRail({ awaitingReplyCount = 0 }: { awaitingReplyCount?: number }) {
  return (
    <ContextRailModule eyebrow="Support" title="Help pulse" ariaLabel="Help context">
      <ContextRailBlock title="Go">
        <div className="flex flex-col gap-1.5">
          <Link
            href="/dashboard/help?view=tickets"
            className="flex items-center justify-between gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
              My tickets
            </span>
            {awaitingReplyCount > 0 ? (
              <span className="rounded-full bg-[var(--pf-red-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--pf-red)]">
                {awaitingReplyCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/dashboard/help?section=getting-started"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <LifeBuoy className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Getting started
          </Link>
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
