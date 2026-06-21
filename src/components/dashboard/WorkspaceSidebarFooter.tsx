"use client";

import Link from "next/link";
import { LifeBuoy, Megaphone, Sparkles } from "lucide-react";
import { WhatsNewBadge } from "@/components/announcements/WhatsNewBadge";
import { COPY } from "@/lib/copy";
import { WorkspaceGuideTrigger } from "@/components/dashboard/WorkspaceGuideTrigger";
import { cn } from "@/lib/utils";

export function WorkspaceSidebarFooter({
  whatsNewUnread = 0,
  onNavigate,
  className,
}: {
  whatsNewUnread?: number;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("pf-sidebar-footer shrink-0", className)}>
      <Link
        href={COPY.newCallHref}
        onClick={onNavigate}
        className="pf-sidebar-footer-cta hidden lg:flex"
      >
        <Megaphone className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        {COPY.publishCallCta}
      </Link>

      <div className="pf-sidebar-footer-links">
        <Link href="/dashboard/whats-new" onClick={onNavigate} className="pf-sidebar-footer-link">
          <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          <span className="inline-flex items-center gap-1">
            What&apos;s new
            <WhatsNewBadge count={whatsNewUnread} />
          </span>
        </Link>
        <Link href="/dashboard/help" onClick={onNavigate} className="pf-sidebar-footer-link">
          <LifeBuoy className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Help
        </Link>
        <WorkspaceGuideTrigger onOpen={onNavigate} className="pf-sidebar-footer-link" />
      </div>
    </div>
  );
}
