import Link from "next/link";

const SURFACES = [
  {
    title: "Ticker intel",
    scope: "One symbol",
    description:
      "Earnings dates, estimates, and past results on each equity ticker page — use this when you are deep on one name.",
    href: "/dashboard/watchlist",
    linkLabel: "Watchlist → ticker",
  },
  {
    title: "Watchlist calendar",
    scope: "Your symbols · 14 days",
    description:
      "Upcoming reports for equities on your watchlist, with BMO/AMC timing and EPS estimates.",
    href: "/dashboard/watchlist",
    linkLabel: "Watchlist calendar",
  },
  {
    title: "Earnings battleboard",
    scope: "Reporting week · market-wide",
    description:
      "Symbols reporting in the next two weeks with community call lean and Fueled desk direction (calls from the last 30 days).",
    href: "/dashboard/earnings",
    linkLabel: "This page",
    current: true,
  },
];

export function EarningsSurfacesExplainer() {
  return (
    <section
      className="pf-workspace-panel p-5 sm:p-6"
      aria-labelledby="earnings-surfaces-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Three earnings views
      </p>
      <h2
        id="earnings-surfaces-title"
        className="mt-1 text-sm font-bold text-[var(--pf-black)]"
      >
        Ticker, watchlist, and battleboard
      </h2>
      <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[var(--pf-gray-500)]">
        PortFuel surfaces earnings in three places. Use the one that matches whether you are
        researching one symbol, tracking your list, or scanning the reporting week.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {SURFACES.map((surface) => (
          <li
            key={surface.title}
            className={
              "current" in surface && surface.current
                ? "rounded-lg border-2 border-[var(--pf-red)]/30 bg-[var(--pf-gray-50)] px-3.5 py-3"
                : "rounded-lg border border-[var(--pf-border)] px-3.5 py-3"
            }
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              {surface.scope}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--pf-black)]">{surface.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
              {surface.description}
            </p>
            {"current" in surface && surface.current ? (
              <span className="mt-2 inline-block text-xs font-semibold text-[var(--pf-red)]">
                {surface.linkLabel}
              </span>
            ) : (
              <Link
                href={surface.href}
                className="mt-2 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
              >
                {surface.linkLabel} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
