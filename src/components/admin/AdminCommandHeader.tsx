import Link from "next/link";

export function AdminCommandHeader() {
  return (
    <header className="mb-6 border-b border-[var(--pf-border)] pb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Platform · Administration
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--pf-black)] sm:text-2xl">
            Command center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--pf-gray-500)]">
            Analytics, members, billing, desk, and growth ops in one workspace.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
        >
          ← Member workspace
        </Link>
      </div>
    </header>
  );
}
