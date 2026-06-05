import Link from "next/link";

const SURFACES = [
  {
    title: "Ticker page",
    when: "Researching one stock",
    description:
      "On any equity ticker: past and upcoming earnings for that symbol, plus news and SEC filings.",
    href: "/dashboard/watchlist",
    linkLabel: "Pick a symbol on watchlist",
  },
  {
    title: "Watchlist calendar",
    when: "Planning your week",
    description:
      "Only symbols on your watchlist that report in the next 14 days — dates, BMO/AMC, EPS estimates. No community stats.",
    href: "/dashboard/watchlist",
    linkLabel: "Watchlist calendar",
  },
  {
    title: "Earnings",
    when: "Scanning the market",
    description:
      "Every symbol reporting in the next 14 days, plus how PortFuel members and the Fueled desk are positioned (calls from the last 30 days).",
    href: "/dashboard/earnings",
    linkLabel: "This page",
    current: true,
  },
];

export function EarningsSurfacesExplainer() {
  return (
    <section
      className="pf-workspace-panel p-5 sm:p-6"
      aria-labelledby="earnings-how-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        How it works
      </p>
      <h2 id="earnings-how-title" className="mt-1 text-sm font-bold text-[var(--pf-black)]">
        Same earnings dates, three scopes
      </h2>
      <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-[var(--pf-gray-500)]">
        All views use the same market earnings calendar (via Finnhub). Only{" "}
        <strong className="font-semibold text-[var(--pf-gray-700)]">Earnings</strong> layers on
        PortFuel call data — who is long/short before the report.
      </p>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        <li className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
            Step 1 · Market calendar
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--pf-gray-600)]">
            <strong className="font-semibold text-[var(--pf-black)]">Who reports and when?</strong>{" "}
            Next 14 days: symbol, date, before/after market (BMO/AMC), quarter, EPS estimate.
          </p>
        </li>
        <li className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
            Step 2 · Earnings overlay
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--pf-gray-600)]">
            <strong className="font-semibold text-[var(--pf-black)]">Who is positioned?</strong>{" "}
            For reporting symbols only: member calls in the last 30 days, crowd long %, latest Fueled
            desk direction, best return, target progress.
          </p>
        </li>
      </ol>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Where to look
      </p>
      <ul className="mt-2 grid gap-3 sm:grid-cols-3">
        {SURFACES.map((surface) => (
          <li
            key={surface.title}
            className={
              "current" in surface && surface.current
                ? "rounded-lg border-2 border-[var(--pf-red)]/30 bg-white px-3.5 py-3 shadow-[var(--pf-shadow-sm)]"
                : "rounded-lg border border-[var(--pf-border)] px-3.5 py-3"
            }
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              {surface.when}
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
