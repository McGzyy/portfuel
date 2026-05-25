import Link from "next/link";
import { Shield } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import type { HeaderUser } from "@/lib/auth/session-user";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

export function SiteHeader({
  showAuth = true,
  user,
}: {
  showAuth?: boolean;
  user?: HeaderUser;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--pf-border)] bg-white/95 shadow-[var(--pf-shadow-sm)] backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-4">
        <Logo size="md" />
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === "admin" ? (
                <span
                  className={cn(
                    "hidden items-center gap-1.5 rounded-full border border-[var(--pf-red)]/30 bg-[var(--pf-red-muted)] px-3 py-1 text-xs font-semibold text-[var(--pf-red)] sm:inline-flex"
                  )}
                >
                  <Shield className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Administrator
                </span>
              ) : (
                <span className="hidden max-w-[10rem] truncate rounded-full bg-[var(--pf-gray-100)] px-3 py-1 text-xs font-medium text-[var(--pf-gray-600)] sm:inline">
                  @{user.username}
                </span>
              )}
              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href="/rankings"
                className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
              >
                Rankings
              </Link>
              <Link
                href="/profile"
                className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
              >
                Profile
              </Link>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-black)] px-3.5 text-xs font-semibold text-white shadow-[var(--pf-shadow-sm)] hover:bg-[#1a2332]"
              >
                Workspace
              </Link>
              <form action="/api/auth/logout" method="POST">
                <Button variant="ghost" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </>
          ) : showAuth ? (
            <>
              <Link
                href="/rankings"
                className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
              >
                Rankings
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/join">
                <Button size="sm">{COPY.ctaGetAccess}</Button>
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
