"use client";

import Link from "next/link";
import { LifeBuoy, Megaphone, Settings, Shield, User } from "lucide-react";
import { COPY } from "@/lib/copy";
import { WorkspaceGuideTrigger } from "@/components/dashboard/WorkspaceGuideTrigger";
import { cn } from "@/lib/utils";

export function WorkspaceSidebarFooter({
  username,
  isAdmin,
  onNavigate,
  className,
}: {
  username: string;
  isAdmin?: boolean;
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
        <Link href="/dashboard/help" onClick={onNavigate} className="pf-sidebar-footer-link">
          <LifeBuoy className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Help
        </Link>
        <WorkspaceGuideTrigger
          onOpen={onNavigate}
          className="pf-sidebar-footer-link"
        />
        <Link
          href={`/member/${username}`}
          onClick={onNavigate}
          className="pf-sidebar-footer-link"
        >
          <User className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Profile
        </Link>
        <Link href="/dashboard/settings" onClick={onNavigate} className="pf-sidebar-footer-link">
          <Settings className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Settings
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="pf-sidebar-footer-link pf-sidebar-footer-link-wide"
          >
            <Shield className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Admin
          </Link>
        ) : null}
      </div>
    </div>
  );
}
