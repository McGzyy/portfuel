"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  Bell,
  Flame,
  LayoutDashboard,
  Map,
  Megaphone,
  MessageCircle,
  Notebook,
  Rows3,
  ScanSearch,
  Trophy,
  User,
  X,
} from "lucide-react";
import { COPY } from "@/lib/copy";
import { buildWorkspaceGuideSections } from "@/lib/dashboard/nav";
import {
  WORKSPACE_GUIDE_OPEN_EVENT,
  workspaceGuideStorageKey,
} from "@/lib/onboarding/workspace-guide";
import { cn } from "@/lib/utils";

const HREF_ICON: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/feed": Rows3,
  "/dashboard/desk": Flame,
  "/dashboard/watchlist": Bookmark,
  "/dashboard/journal": Notebook,
  "/dashboard/messages": MessageCircle,
  "/dashboard/notifications": Bell,
  "/dashboard/rankings": Trophy,
  "/dashboard/research": ScanSearch,
  "/dashboard/settings": LayoutDashboard,
};

function GuideItemIcon({ href }: { href: string }) {
  if (href === COPY.newCallHref || href.startsWith("/calls/new")) {
    return <Megaphone className="h-4 w-4" strokeWidth={2.25} />;
  }
  if (href.startsWith("/member/")) {
    return <User className="h-4 w-4" strokeWidth={2.25} />;
  }
  const Icon = HREF_ICON[href] ?? Map;
  return <Icon className="h-4 w-4" strokeWidth={2.25} />;
}

export function WorkspaceGuide({
  username,
  userId,
  autoShow = false,
}: {
  username: string;
  userId: string;
  /** First workspace visit after onboarding — server + DB backed. */
  autoShow?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const sections = buildWorkspaceGuideSections(username);
  const storageKey = workspaceGuideStorageKey(userId);

  const openGuide = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onOpen = () => openGuide();
    window.addEventListener(WORKSPACE_GUIDE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(WORKSPACE_GUIDE_OPEN_EVENT, onOpen);
  }, [openGuide]);

  useEffect(() => {
    if (!autoShow) return;

    try {
      if (localStorage.getItem(storageKey) === "1") return;
    } catch {
      /* ignore */
    }

    const t = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(t);
  }, [autoShow, storageKey]);

  async function dismissGuide() {
    setDismissing(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/workspace-guide", { method: "POST" });
    } catch {
      /* best effort */
    }
    setOpen(false);
    setDismissing(false);
    router.refresh();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[var(--pf-black)]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4 sm:pb-4"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingTop: "var(--pf-safe-top)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) void dismissGuide();
      }}
    >
      <div className="pf-guide-modal flex max-h-[min(92dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--pf-border)] shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:max-h-[88vh] sm:rounded-[var(--pf-radius-lg)]">
        <div className="relative shrink-0 overflow-hidden border-b border-[var(--pf-border)] px-5 pb-5 pt-6 sm:px-6 sm:pt-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, var(--pf-red) 0%, transparent 45%), radial-gradient(circle at 80% 0%, var(--pf-navy) 0%, transparent 40%)",
            }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--pf-border)] bg-[color-mix(in_srgb,var(--pf-surface)_80%,transparent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--pf-gray-500)] backdrop-blur-sm">
                <Map className="h-3 w-3 text-[var(--pf-red)]" />
                Workspace map
              </div>
              <h2
                id="workspace-guide-title"
                className="mt-3 text-xl font-bold tracking-tight text-[var(--pf-black)] sm:text-2xl"
              >
                Welcome to PortFuel
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--pf-gray-600)]">
                Your trading workspace in one place — community calls, desk research, watchlist
                alerts, and your public track record.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void dismissGuide()}
              disabled={dismissing}
              className="shrink-0 rounded-lg p-2 text-[var(--pf-gray-500)] transition-colors hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-black)]"
              aria-label="Close workspace map"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-[var(--pf-border)]" />
                <h3 className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--pf-gray-400)]">
                  {section.title}
                </h3>
                <span className="h-px flex-1 bg-[var(--pf-border)]" />
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => void dismissGuide()}
                      className="pf-guide-card group"
                    >
                      <span className="pf-guide-icon mt-0.5">
                        <GuideItemIcon href={item.href} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-sm font-semibold text-[var(--pf-black)]">
                          {item.label}
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-[var(--pf-gray-500)]">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="shrink-0 space-y-3 border-t border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-5 py-4 sm:px-6">
          <p className="text-center text-xs leading-relaxed text-[var(--pf-gray-500)]">
            New here? Work through the launch checklist on{" "}
            <Link
              href="/dashboard"
              className="font-semibold text-[var(--pf-red)] hover:underline"
              onClick={() => void dismissGuide()}
            >
              Overview
            </Link>
            {" "}
            or browse the full{" "}
            <Link
              href="/dashboard/help"
              className="font-semibold text-[var(--pf-red)] hover:underline"
              onClick={() => void dismissGuide()}
            >
              help center
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={() => void dismissGuide()}
            disabled={dismissing}
            className={cn(
              "w-full rounded-lg bg-[var(--pf-black)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--pf-gray-800)] disabled:opacity-60",
              "sm:py-2.5"
            )}
          >
            {dismissing ? "Saving…" : "Got it — start exploring"}
          </button>
        </div>
      </div>
    </div>
  );
}
