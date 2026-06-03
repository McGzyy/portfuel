import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TickerIntel } from "@/lib/market/ticker-intel";

export function TickerCompanyStats({ intel }: { intel: TickerIntel }) {
  if (intel.assetClass !== "equity") return null;

  const { profile } = intel;
  const hasStats =
    profile?.marketCapitalization != null ||
    profile?.shareOutstanding != null ||
    profile?.ipo ||
    profile?.weburl;

  if (!profile && !hasStats) {
    return (
      <section>
        <p className="pf-eyebrow">Company</p>
        <h2 className="mt-2 text-lg font-bold tracking-tight">{intel.companyName}</h2>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          {intel.symbol} · Profile data unavailable for this symbol.
        </p>
      </section>
    );
  }

  return (
    <section>
      <p className="pf-eyebrow">Company</p>
      <h2 className="mt-2 text-lg font-bold tracking-tight">
        {profile?.name ?? intel.companyName}
      </h2>
      {profile?.finnhubIndustry ? (
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">{profile.finnhubIndustry}</p>
      ) : null}
      <Card className="pf-card-elevated mt-4 border-0">
        <CardHeader className="pb-2">
          <h3 className="text-base font-bold tracking-tight">Company stats</h3>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {profile?.marketCapitalization != null ? (
              <Stat
                label="Market cap"
                value={`$${(profile.marketCapitalization / 1e3).toFixed(1)}B`}
              />
            ) : null}
            {profile?.shareOutstanding != null ? (
              <Stat
                label="Shares out"
                value={`${(profile.shareOutstanding / 1e6).toFixed(1)}M`}
              />
            ) : null}
            {profile?.ipo ? <Stat label="IPO" value={profile.ipo} /> : null}
            <Stat label="Ticker" value={intel.symbol} />
          </dl>
          {profile?.weburl ? (
            <a
              href={profile.weburl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-[var(--pf-red)] hover:underline"
            >
              Company website →
            </a>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--pf-gray-500)]">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
