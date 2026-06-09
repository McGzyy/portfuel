"use client";

import Link from "next/link";
import { Megaphone, Settings, Shield, User } from "lucide-react";
import { COPY } from "@/lib/copy";
import { WorkspaceGuideTrigger } from "@/components/dashboard/WorkspaceGuideTrigger";
import { cn } from "@/lib/utils";

const footerLinkClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-[var(--pf-gray-600)] transition-colors hover:bg-[var(--pf-gray-100)] hover:text-[var(--foreground)]";

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
    <div className={cn("shrink-0 border-t border-[var(--pf-border)] p-3", className)}>
      <Link
        href={COPY.newCallHref}
        onClick={onNavigate}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--pf-red)] px-3 py-2.5 text-sm font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)]"
      >
        <Megaphone className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        {COPY.publishCallCta}
      </Link>

      <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Account
      </p>
      <div className="space-y-0.5">
        <Link href={`/member/${username}`} onClick={onNavigate} className={footerLinkClass}>
          <User className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
          Profile
        </Link>
        <Link href="/dashboard/settings" onClick={onNavigate} className={footerLinkClass}>
          <Settings className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
          Settings
        </Link>
        {isAdmin ? (
          <Link href="/admin" onClick={onNavigate} className={footerLinkClass}>
            <Shield className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
            Admin
          </Link>
        ) : null}
        <WorkspaceGuideTrigger
          onOpen={onNavigate}
          className={cn(footerLinkClass, "w-full text-left")}
          iconClassName="h-4 w-4 text-[var(--pf-gray-400)]"
          label="Workspace map"
        />
      </div>
    </div>
  );
}
