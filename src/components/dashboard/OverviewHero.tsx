import Link from "next/link";

export function OverviewHero({
  displayName,
  username,
  winRate,
  rankScore,
  callsCount,
}: {
  displayName: string;
  username: string;
  winRate: number | null | undefined;
  rankScore: number | null | undefined;
  callsCount?: number | null;
}) {
  return (
    <section className="pf-overview-hero overflow-hidden rounded-[var(--pf-radius-lg)]">
      <div className="relative z-[1] px-6 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-300/90">
              Member workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {displayName}
            </h1>
            <Link
              href={`/member/${username}`}
              className="mt-1 inline-block font-mono text-sm text-slate-400 transition-colors hover:text-white"
            >
              @{username}
            </Link>
          </div>
          <dl className="flex gap-8 sm:gap-10">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Win rate
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-white">
                {winRate != null ? `${winRate}%` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Rank
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-white">
                {rankScore != null ? rankScore.toFixed(1) : "—"}
              </dd>
            </div>
            {callsCount != null ? (
              <div className="hidden sm:block">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Calls
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{callsCount}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  );
}
