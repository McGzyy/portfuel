import { formatPrice } from "@/lib/utils";
import type { TickerIntel } from "@/lib/market/ticker-intel";

function fmtCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function WatchlistJournalStats({ intel }: { intel: TickerIntel }) {
  const { profile, quote } = intel;
  const items: { label: string; value: string }[] = [
    { label: "Price", value: quote ? `$${formatPrice(quote.price)}` : "—" },
  ];

  if (profile?.name) items.unshift({ label: "Company", value: profile.name });
  if (profile?.finnhubIndustry) items.push({ label: "Industry", value: profile.finnhubIndustry });
  if (profile?.marketCapitalization != null) {
    items.push({ label: "Market cap", value: fmtCap(profile.marketCapitalization) });
  }

  return (
    <div className="pf-workspace-panel p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Reference · auto-filled
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              {item.label}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--pf-black)]">{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[10px] text-[var(--pf-gray-500)]">
        Private journal — only you can see thesis, plan levels, and updates below.
      </p>
    </div>
  );
}
