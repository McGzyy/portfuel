export function EarningsBattleboardLegend() {
  return (
    <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-xs leading-relaxed text-[var(--pf-gray-600)]">
      <p className="font-semibold text-[var(--pf-black)]">Reading the table</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <span className="font-semibold text-[var(--pf-gray-800)]">Community</span> — member calls
          on this symbol in the last 30 days; long % needs at least 2 calls.
        </li>
        <li>
          <span className="font-semibold text-[var(--pf-gray-800)]">Desk</span> — direction of the
          latest Fueled house call on this symbol.
        </li>
        <li>
          <span className="font-semibold text-[var(--pf-gray-800)]">Diverge</span> — crowd lean and
          desk disagree (both need a clear lean).
        </li>
      </ul>
      <p className="mt-2 text-[var(--pf-gray-500)]">
        Symbols with no PortFuel calls still show the report date — community columns stay empty until
        someone publishes.
      </p>
    </div>
  );
}
