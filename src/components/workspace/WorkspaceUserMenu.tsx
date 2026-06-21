"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Compass,
  LifeBuoy,
  LogOut,
  Radar,
  Settings,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { WhatsNewBadge } from "@/components/announcements/WhatsNewBadge";
import { WorkspaceGuideTrigger } from "@/components/dashboard/WorkspaceGuideTrigger";
import { usePublishIdentities } from "@/hooks/usePublishIdentities";
import type { HeaderUser } from "@/lib/auth/session-user";
import { cn } from "@/lib/utils";

function MenuLink({
  href,
  icon: Icon,
  children,
  badge,
  onNavigate,
}: {
  href: string;
  icon: typeof User;
  children: React.ReactNode;
  badge?: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
    >
      <Icon className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
      <span className="flex min-w-0 flex-1 items-center gap-1.5">{children}</span>
      {badge}
    </Link>
  );
}

function MenuSection({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="px-1.5 py-1">
      {label ? (
        <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]">
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function PublishAsSection({ onClose }: { onClose: () => void }) {
  const { active, identities, hasMultiple, busy, switchTo, loaded } = usePublishIdentities();
  const [expanded, setExpanded] = useState(false);

  if (!loaded || !hasMultiple) return null;

  return (
    <div className="border-t border-[var(--pf-border)] px-1.5 py-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
        aria-expanded={expanded}
      >
        <User className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Publish as
          </span>
          <span className="block truncate font-semibold text-[var(--pf-black)]">
            {active?.label ?? "—"}
          </span>
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--pf-gray-400)] transition-transform",
            expanded && "rotate-90"
          )}
          aria-hidden
        />
      </button>
      {expanded ? (
        <ul className="mt-0.5 space-y-0.5 pb-1 pl-2">
          {identities.map((identity) => {
            const isActive = identity.userId === active?.userId;
            return (
              <li key={identity.userId}>
                <button
                  type="button"
                  disabled={busy || isActive}
                  onClick={() => {
                    void switchTo(identity.userId).then((ok) => {
                      if (ok) onClose();
                    });
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-[var(--pf-gray-50)]",
                    isActive && "bg-[var(--pf-gray-50)] font-semibold text-[var(--pf-black)]"
                  )}
                >
                  <span className="min-w-0 truncate">{identity.label}</span>
                  {isActive ? (
                    <span className="ml-2 shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
                      Active
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function WorkspaceUserMenu({
  user,
  avatarUrl,
  whatsNewUnread = 0,
}: {
  user: HeaderUser;
  avatarUrl?: string | null;
  whatsNewUnread?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const displayName = user.displayName ?? user.username;
  const isAdmin = user.role === "admin";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg border border-transparent py-1 pl-1 pr-2 hover:border-[var(--pf-border)] hover:bg-[var(--pf-gray-50)]"
      >
        <MemberAvatar
          displayName={displayName}
          username={user.username}
          avatarUrl={avatarUrl}
          size="sm"
        />
        <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-[var(--pf-black)] sm:inline">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 shrink-0 text-[var(--pf-gray-400)] transition-transform sm:block",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[100] mt-1.5 w-[min(17rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[var(--pf-surface)] py-1 shadow-[0_12px_40px_-8px_rgb(15_23_42_/_0.22)]"
        >
          <div className="border-b border-[var(--pf-border)] px-4 py-3">
            <p className="truncate text-sm font-bold text-[var(--pf-black)]">{displayName}</p>
            <p className="truncate font-mono text-xs text-[var(--pf-gray-500)]">@{user.username}</p>
          </div>

          <MenuSection>
            <MenuLink href={`/member/${user.username}`} icon={User} onNavigate={close}>
              Profile
            </MenuLink>
            <MenuLink href="/dashboard/settings" icon={Settings} onNavigate={close}>
              Settings
            </MenuLink>
            <MenuLink
              href="/dashboard/whats-new"
              icon={Sparkles}
              onNavigate={close}
              badge={<WhatsNewBadge count={whatsNewUnread} />}
            >
              What&apos;s new
            </MenuLink>
          </MenuSection>

          <MenuSection label="Help">
            <MenuLink href="/dashboard/help" icon={LifeBuoy} onNavigate={close}>
              Help center
            </MenuLink>
            <WorkspaceGuideTrigger
              onOpen={close}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
            />
          </MenuSection>

          {isAdmin ? (
            <MenuSection label="Admin">
              <MenuLink href="/admin" icon={Shield} onNavigate={close}>
                Admin console
              </MenuLink>
              <MenuLink href="/admin?tab=discovery" icon={Radar} onNavigate={close}>
                Discovery
              </MenuLink>
              <MenuLink href="/admin?tab=analytics" icon={BarChart3} onNavigate={close}>
                Analytics
              </MenuLink>
              <MenuLink href="/dashboard/research" icon={Compass} onNavigate={close}>
                Pro research
              </MenuLink>
            </MenuSection>
          ) : null}

          {isAdmin ? <PublishAsSection onClose={close} /> : null}

          <div className="border-t border-[var(--pf-border)] px-1.5 py-1">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
              >
                <LogOut className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
