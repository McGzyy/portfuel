import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TickerIntel } from "@/lib/market/ticker-intel";

function formatDate(d: string | number) {
  if (typeof d === "number") return new Date(d * 1000).toLocaleDateString();
  return new Date(d).toLocaleDateString();
}

export function TickerIntelPanel({ intel }: { intel: TickerIntel }) {
  if (intel.assetClass === "crypto") {
    return (
      <Card className="mt-8">
        <CardHeader>
          <h2 className="text-lg font-bold">Crypto · Major exchanges only</h2>
          <p className="text-sm text-[var(--pf-gray-500)]">
            Listed on Coinbase/Kraken. No memecoins. Filings and earnings apply to stocks only.
          </p>
        </CardHeader>
        <CardContent className="text-sm text-[var(--pf-gray-600)]">
          <p>
            <span className="font-medium">Venue:</span> {intel.finnhubSymbol ?? intel.symbol}
          </p>
          <p className="mt-2">
            Track narrative and squad calls below. For stocks, switch to an equity ticker to see
            news, earnings, and SEC filings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <IntelCard title="News" subtitle="Last 30 days">
        {intel.news.length === 0 ? (
          <Empty>No recent headlines from Finnhub.</Empty>
        ) : (
          <ul className="space-y-3">
            {intel.news.map((n) => (
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

      {intel.profile ? (
        <IntelCard title="Company stats" subtitle={intel.profile.finnhubIndustry ?? ""}>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {intel.profile.marketCapitalization != null ? (
              <Stat label="Market cap" value={`$${(intel.profile.marketCapitalization / 1e3).toFixed(1)}B`} />
            ) : null}
            {intel.profile.shareOutstanding != null ? (
              <Stat
                label="Shares out"
                value={`${(intel.profile.shareOutstanding / 1e6).toFixed(1)}M`}
              />
            ) : null}
            {intel.profile.ipo ? <Stat label="IPO" value={intel.profile.ipo} /> : null}
            {intel.profile.weburl ? (
              <div className="col-span-2">
                <a
                  href={intel.profile.weburl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--pf-red)] hover:underline"
                >
                  Company website →
                </a>
              </div>
            ) : null}
          </dl>
        </IntelCard>
      ) : null}
    </div>
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
    <Card className={className}>
      <CardHeader>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-[var(--pf-gray-500)]">{subtitle}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--pf-gray-500)]">{children}</p>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--pf-gray-500)]">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
