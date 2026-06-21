"use client";

import Link from "next/link";
import { LifeBuoy, Megaphone, Settings, Shield, Sparkles, User } from "lucide-react";
import { WhatsNewBadge } from "@/components/announcements/WhatsNewBadge";
import { COPY } from "@/lib/copy";
import { WorkspaceGuideTrigger } from "@/components/dashboard/WorkspaceGuideTrigger";
import { WorkspaceSignOutButton } from "@/components/auth/WorkspaceSignOutButton";
import { cn } from "@/lib/utils";

export function WorkspaceSidebarFooter({
  username,
  isAdmin,
  whatsNewUnread = 0,
  onNavigate,
  className,
}: {
  username: string;
  isAdmin?: boolean;
  whatsNewUnread?: number;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("pf-sidebar-footer shrink-0", className)}>
      <Link
        href={COPY.newCallHref}
        onClick={onNavigate}
        className="pf-sidebar-footer-cta"
      >
        <Megaphone className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        {COPY.publishCallCta}
      </Link>

      <div className="pf-sidebar-footer-links">
        <Link href="/dashboard/whats-new" onClick={onNavigate} className="pf-sidebar-footer-link">
          <Sparkles className="h-3 w-3 shrink-0" strokeWidth={2.25} />
          <span className="inline-flex items-center gap-1">
            What&apos;s new
            <WhatsNewBadge count={whatsNewUnread} />
          </span>
        </Link>
        <Link href="/dashboard/help" onClick={onNavigate} className="pf-sidebar-footer-link">
          <LifeBuoy className="h-3 w-3 shrink-0" strokeWidth={2.25} />
          Help
        </Link>
        <WorkspaceGuideTrigger onOpen={onNavigate} className="pf-sidebar-footer-link" />
        <Link
          href={`/member/${username}`}
          onClick={onNavigate}
          className="pf-sidebar-footer-link"
        >
          <User className="h-3 w-3 shrink-0" strokeWidth={2.25} />
          Profile
        </Link>
        <Link href="/dashboard/settings" onClick={onNavigate} className="pf-sidebar-footer-link">
          <Settings className="h-3 w-3 shrink-0" strokeWidth={2.25} />
          Settings
        </Link>
        {isAdmin ? (
          <Link href="/admin" onClick={onNavigate} className="pf-sidebar-footer-link">
            <Shield className="h-3 w-3 shrink-0" strokeWidth={2.25} />
            Admin
          </Link>
        ) : null}
      </div>
      <div className="mt-2 border-t border-[var(--pf-border)] pt-2">
        <WorkspaceSignOutButton />
      </div>
    </div>
  );
}
