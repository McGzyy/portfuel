import Link from "next/link";

export function SettingsCommandHeader({ username }: { username: string }) {
  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Account
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
          Membership, billing, email, referrals, and integrations — separate from your public
          track record page.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
          <Link
            href="/dashboard"
            className="text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            ← Workspace
          </Link>
          <Link
            href={`/member/${username}`}
            className="text-[var(--pf-red)] hover:underline"
          >
            View public profile →
          </Link>
        </div>
      </div>
    </header>
  );
}
