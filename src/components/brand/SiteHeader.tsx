import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import type { HeaderUser } from "@/lib/auth/session-user";
import { NotificationBell } from "@/components/notifications/NotificationBell";
export function SiteHeader({
  showAuth = true,
  user,
  headerMode = "default",
  logoHref: logoHrefProp,
}: {
  showAuth?: boolean;
  user?: HeaderUser;
  /** Slim nav when sidebar already covers workspace destinations. */
  headerMode?: "default" | "workspace";
  /** Override logo link (e.g. /demo for public workspace preview). */
  logoHref?: string;
}) {
  const inWorkspace = headerMode === "workspace" && Boolean(user);
  const logoHref = logoHrefProp ?? (user ? "/dashboard" : "/");

  return (
    <header className="pf-site-header sticky z-50 border-b border-[var(--pf-border)] shadow-[var(--pf-shadow-sm)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-[4.5rem] sm:gap-3 sm:px-4">
        <Logo size="xs" href={logoHref} className="min-w-0 sm:hidden" unoptimized />
        <Logo size="md" href={logoHref} className="hidden min-w-0 sm:inline-flex" unoptimized />
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          {user ? (
            <>
              {user.role === "admin" && !inWorkspace ? (
                <Link
                  href="/admin"
                  className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
                >
                  Admin
                </Link>
              ) : user.role !== "admin" ? (
                <span className="hidden max-w-[10rem] truncate rounded-full bg-[var(--pf-gray-100)] px-3 py-1 text-xs font-medium text-[var(--pf-gray-600)] sm:inline">
                  @{user.username}
                </span>
              ) : null}
              {!inWorkspace ? (
                <>
                  <Link
                    href="/rankings"
                    className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
                  >
                    Rankings
                  </Link>
                  <Link
                    href={`/member/${user.username}`}
                    className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
                  >
                    Settings
                  </Link>
                </>
              ) : null}
              <NotificationBell />
              {!inWorkspace ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-black)] px-3.5 text-xs font-semibold text-white shadow-[var(--pf-shadow-sm)] hover:bg-[#1a2332]"
                >
                  Workspace
                </Link>
              ) : null}
              <form action="/api/auth/logout" method="POST">
                <Button variant="ghost" size="sm" type="submit">
                  Log out
                </Button>
              </form>
            </>
          ) : showAuth ? (
            <>
              <Link
                href="/demo"
                className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
              >
                Demo
              </Link>
              <Link
                href="/rankings"
                className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] sm:inline"
              >
                Rankings
              </Link>
              <Link href="/login" className="shrink-0">
                <Button variant="ghost" size="sm" className="h-8 px-2.5 sm:h-9 sm:px-3">
                  Sign in
                </Button>
              </Link>
              <Link href="/join" className="shrink-0">
                <Button size="sm" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm">
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">{COPY.ctaGetAccess}</span>
                </Button>
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
