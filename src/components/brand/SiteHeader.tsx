import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export function SiteHeader({
  showAuth = true,
  userPin,
}: {
  showAuth?: boolean;
  userPin?: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--pf-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2">
          {userPin ? (
            <>
              <span className="hidden text-sm text-[var(--pf-gray-500)] sm:inline">
                ID {userPin}
              </span>
              <Link
                href="/dashboard"
                className="inline-flex h-8 items-center rounded-lg border border-[var(--pf-border)] px-3 text-xs font-medium hover:bg-[var(--pf-gray-50)]"
              >
                Dashboard
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
                href="/login"
                className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-100)]"
              >
                Login
              </Link>
              <Link
                href="/join"
                className="inline-flex h-8 items-center rounded-lg bg-[var(--pf-red)] px-3 text-xs font-medium text-white hover:bg-[#c41820]"
              >
                Join the Squad
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
