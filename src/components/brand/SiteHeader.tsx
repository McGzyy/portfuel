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
    <header className="sticky top-0 z-50 border-b border-[var(--pf-border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2">
          {userPin ? (
            <>
              <span className="hidden rounded-full bg-[var(--pf-gray-100)] px-3 py-1 text-xs font-medium tabular-nums text-[var(--pf-gray-600)] sm:inline">
                ID {userPin}
              </span>
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center rounded-[var(--pf-radius)] border border-[var(--pf-border)] px-3.5 text-xs font-semibold shadow-[var(--pf-shadow-sm)] hover:bg-[var(--pf-gray-50)]"
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
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/join">
                <Button size="sm">Join the Squad</Button>
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
