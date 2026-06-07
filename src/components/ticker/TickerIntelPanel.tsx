import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TickerIntel } from "@/lib/market/ticker-intel";

function formatDate(d: string | number) {
  if (typeof d === "number") return new Date(d * 1000).toLocaleDateString();
  return new Date(d).toLocaleDateString();
}

function formatPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function TickerIntelPanel({ intel }: { intel: TickerIntel }) {
  if (intel.assetClass === "crypto") {
    const exchange = intel.cryptoMeta?.exchange ?? "coinbase";
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <IntelCard title="Venue" subtitle="Coinbase / Kraken listed pairs">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--pf-gray-500)]">Asset</dt>
              <dd className="font-semibold text-[var(--pf-black)]">
                {intel.cryptoMeta?.displayName ?? intel.companyName}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--pf-gray-500)]">Symbol</dt>
              <dd className="font-mono font-semibold">{intel.symbol}</dd>
            </div>
            <div>
              <dt className="text-[var(--pf-gray-500)]">Primary exchange</dt>
              <dd className="capitalize font-semibold">{exchange}</dd>
            </div>
            <div>
              <dt className="text-[var(--pf-gray-500)]">Finnhub pair</dt>
              <dd className="font-mono text-xs text-[var(--pf-gray-700)]">
                {intel.finnhubSymbol ?? "—"}
              </dd>
            </div>
            {intel.quote ? (
              <div>
                <dt className="text-[var(--pf-gray-500)]">Last · daily change</dt>
                <dd className="font-semibold tabular-nums">
                  ${intel.quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                  <span
                    className={
                      intel.quote.changePct >= 0 ? "text-emerald-600" : "text-rose-600"
                    }
                  >
                    {formatPct(intel.quote.changePct)}
                  </span>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-[var(--pf-gray-500)]">
            Exchange-listed majors only — no memecoins. Earnings and SEC filings are available on
            equity tickers.
          </p>
        </IntelCard>

        <IntelCard title="Headlines" subtitle="Crypto news mentioning this symbol">
          {intel.news.length === 0 ? (
            <Empty>
              No symbol-tagged headlines in the latest crypto feed. Check back after major moves or
              open an equity ticker for earnings and filings.
            </Empty>
          ) : (
            <NewsList items={intel.news} />
          )}
        </IntelCard>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <IntelCard title="News" subtitle="Last 30 days">
        {intel.news.length === 0 ? (
          <Empty>No recent headlines from Finnhub.</Empty>
        ) : (
          <NewsList items={intel.news} />
        )}
      </IntelCard>

      <IntelCard title="Earnings" subtitle="Reports & estimates">
        {intel.earnings.length === 0 ? (
          <Empty>No earnings data for this symbol.</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {intel.earnings.map((e, i) => (
              <li
                key={`${e.date}-${i}`}
                className="flex justify-between gap-2 rounded-lg bg-[var(--pf-gray-50)] px-3 py-2"
              >
                <span>
                  {e.date} · Q{e.quarter} {e.year}
                </span>
                <span className="tabular-nums text-[var(--pf-gray-600)]">
                  EPS {e.epsActual ?? "—"} / est {e.epsEstimate ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </IntelCard>

      <IntelCard title="SEC filings" subtitle="Recent forms" className="lg:col-span-2">
        {intel.filings.length === 0 ? (
          <Empty>
            No filings returned (may require a higher Finnhub tier).{" "}
            <a
              href={`https://www.sec.gov/edgar/search/#/q=${intel.symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--pf-red)] hover:underline"
            >
              Search EDGAR →
            </a>
          </Empty>
        ) : (
          <ul className="divide-y divide-[var(--pf-border)]">
            {intel.filings.map((f) => (
              <li key={f.accessNumber} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className="font-semibold">{f.form}</span>
                  <span className="ml-2 text-sm text-[var(--pf-gray-500)]">filed {f.filedDate}</span>
                </div>
                <a
                  href={f.reportUrl || f.filingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--pf-red)] hover:underline"
                >
                  View filing
                </a>
              </li>
            ))}
          </ul>
        )}
      </IntelCard>
    </div>
  );
}

function NewsList({ items }: { items: TickerIntel["news"] }) {
  return (
    <ul className="space-y-3">
      {items.map((n) => (
        <li key={n.id} className="border-b border-[var(--pf-border)] pb-3 last:border-0">
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--pf-black)] hover:text-[var(--pf-red)]"
          >
            {n.headline}
          </a>
          <p className="mt-1 text-xs text-[var(--pf-gray-400)]">
            {n.source} · {formatDate(n.datetime)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function IntelCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`pf-card-elevated border-0 ${className ?? ""}`}>
      <CardHeader>
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        <p className="text-sm text-[var(--pf-gray-500)]">{subtitle}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--pf-gray-500)]">{children}</p>;
}
