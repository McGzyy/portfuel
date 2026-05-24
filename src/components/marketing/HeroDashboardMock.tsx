import { Badge } from "@/components/ui/badge";

/** Decorative product preview for the landing hero — not live data. */
export function HeroDashboardMock() {
  return (
    <div className="pf-mock-frame relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-4 rounded-3xl bg-[var(--pf-red)]/10 blur-2xl" aria-hidden />
      <div className="pf-mock-panel relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pf-gray-400)]">
              Dashboard
            </p>
            <p className="text-sm font-bold text-[var(--pf-black)]">Latest calls</p>
          </div>
          <span className="rounded-full bg-[var(--pf-red)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Live
          </span>
        </div>

        <div className="space-y-3 p-4">
          <MockCall
            symbol="NVDA"
            direction="long"
            returnPct="+12.4%"
            name="FuelRunner"
            thesis="AI capex cycle intact — pullback entry into earnings run."
            positive
          />
          <MockCall
            symbol="BTC"
            direction="long"
            returnPct="+5.8%"
            name="MacroFuel"
            thesis="ETF flows + halving supply — swing long above weekly VWAP."
            crypto
          />
        </div>

        <div className="border-t border-[var(--pf-border)] bg-white px-4 py-3">
          <div className="flex items-end justify-between gap-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={d + i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-[var(--pf-red)]/80"
                  style={{ height: `${28 + (i % 4) * 12}px` }}
                />
                <span className="text-[9px] text-[var(--pf-gray-400)]">{d}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-[var(--pf-gray-400)]">
            Chart + call markers on every ticker
          </p>
        </div>
      </div>
    </div>
  );
}

function MockCall({
  symbol,
  direction,
  returnPct,
  name,
  thesis,
  positive,
  crypto,
}: {
  symbol: string;
  direction: "long" | "short";
  returnPct: string;
  name: string;
  thesis: string;
  positive?: boolean;
  crypto?: boolean;
}) {
  return (
    <div className="rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white p-3 shadow-[var(--pf-shadow-sm)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-[var(--pf-black)]">{symbol}</span>
          <Badge variant={direction === "long" ? "long" : "short"}>{direction}</Badge>
          {crypto ? <Badge variant="default">Crypto</Badge> : null}
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${positive ? "text-emerald-600" : "text-rose-600"}`}
        >
          {returnPct}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-[var(--pf-gray-500)]">{name}</p>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--pf-gray-600)]">{thesis}</p>
    </div>
  );
}
