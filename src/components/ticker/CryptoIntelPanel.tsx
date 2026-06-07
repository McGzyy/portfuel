import { summarizeTickerCommunity } from "@/lib/calls/ticker-community-stats";
import type { TickerIntel } from "@/lib/market/ticker-intel";
import { computeCandleReturnWindows } from "@/lib/market/candle-returns";
import { formatPct, formatPrice } from "@/lib/utils";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg bg-[var(--pf-gray-50)] px-3 py-2">
      <span className="text-[var(--pf-gray-500)]">{label}</span>
      <span className="font-semibold tabular-nums text-[var(--pf-black)]">{value}</span>
    </div>
  );
}

function ReturnRow({ label, value }: { label: string; value: number | null }) {
  const retClass =
    value == null
      ? "text-[var(--pf-gray-500)]"
      : value >= 0
        ? "text-emerald-600"
        : "text-rose-600";
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg bg-[var(--pf-gray-50)] px-3 py-2">
      <span className="text-[var(--pf-gray-500)]">{label}</span>
      <span className={`font-semibold tabular-nums ${retClass}`}>{formatPct(value)}</span>
    </div>
  );
}

export function CryptoIntelPanel({ intel }: { intel: TickerIntel }) {
  const exchange = intel.cryptoMeta?.exchange ?? "coinbase";
  const returns = computeCandleReturnWindows(intel.candles);
  const community = summarizeTickerCommunity(intel.calls);

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
            <dd className="font-semibold capitalize">{exchange}</dd>
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
                  {intel.quote.changePct >= 0 ? "+" : ""}
                  {intel.quote.changePct.toFixed(2)}%
                </span>
              </dd>
            </div>
          ) : null}
        </dl>
      </IntelCard>

      <IntelCard title="Price action" subtitle="From daily candles (1Y window)">
        <div className="space-y-2 text-sm">
          <ReturnRow label="7 day" value={returns.d7} />
          <ReturnRow label="30 day" value={returns.d30} />
          <ReturnRow label="90 day" value={returns.d90} />
          <ReturnRow label="YTD" value={returns.ytd} />
          <StatRow label="52w high" value={formatPrice(returns.high52w)} />
          <StatRow label="52w low" value={formatPrice(returns.low52w)} />
        </div>
      </IntelCard>

      {community.callCount > 0 ? (
        <IntelCard title="Community conviction" subtitle="Published calls on this symbol">
          <div className="space-y-2 text-sm">
            <StatRow label="Member calls" value={String(community.callCount)} />
            <StatRow
              label="Long / short"
              value={`${community.longCount} / ${community.shortCount}`}
            />
            <StatRow label="Fueled desk" value={String(community.fueledCount)} />
            <ReturnRow label="Avg return" value={community.avgReturnPct} />
            <ReturnRow label="Best call" value={community.bestReturnPct} />
            <StatRow label="Trusted callers" value={String(community.trustedCallers)} />
          </div>
        </IntelCard>
      ) : null}

      <IntelCard
        title="Headlines"
        subtitle="Crypto news mentioning this symbol"
        className={community.callCount > 0 ? undefined : "lg:col-span-1"}
      >
        {intel.news.length === 0 ? (
          <Empty>
            No symbol-tagged headlines in the latest crypto feed. Check back after major moves.
          </Empty>
        ) : (
          <NewsList items={intel.news} />
        )}
      </IntelCard>
    </div>
  );
}

function formatDate(d: string | number) {
  if (typeof d === "number") return new Date(d * 1000).toLocaleDateString();
  return new Date(d).toLocaleDateString();
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
    <div
      className={`rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-4 shadow-[var(--pf-shadow-sm)] ${className ?? ""}`}
    >
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
      <p className="mt-0.5 text-sm text-[var(--pf-gray-500)]">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--pf-gray-500)]">{children}</p>;
}
