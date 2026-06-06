import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { WatchlistJournalWorkspace } from "@/components/watchlist/WatchlistJournalWorkspace";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { loadTickerIntel } from "@/lib/market/ticker-intel";
import { buildPublishUrlFromJournal } from "@/lib/watchlist/journal-call-url";
import { fetchJournalEntries, fetchWatchlistJournal } from "@/lib/watchlist/journal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `${symbol.toUpperCase()} · Journal`,
  };
}

export default async function DashboardJournalSymbolPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ setup?: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const sp = await searchParams;
  const session = await requireDashboardSession();

  if (isDemoMode() || !hasSupabaseConfig()) {
    notFound();
  }

  const journal = await fetchWatchlistJournal(session.userId, symbol);
  if (!journal) notFound();

  const [entries, intel] = await Promise.all([
    fetchJournalEntries(session.userId, symbol),
    loadTickerIntel(symbol).catch(() => null),
  ]);

  const intelData =
    intel ??
    ({
      symbol,
      assetClass: journal.asset_class,
      companyName: symbol,
      quote: null,
      hypeScore: 0,
      candles: [],
      markers: [],
      calls: [],
      news: [],
      earnings: [],
      filings: [],
      profile: null,
    } as Awaited<ReturnType<typeof loadTickerIntel>>);

  const proContext = sessionToProContext(session);
  const proUnlocked = canAccessProIntelligence(proContext);
  const publishUrl = buildPublishUrlFromJournal(journal);

  return (
    <div className="space-y-6">
      <WorkspaceQuickActions proUnlocked={proUnlocked} />
      <WatchlistJournalWorkspace
        journal={journal}
        entries={entries}
        intel={intelData}
        publishUrl={publishUrl}
        proUnlocked={proUnlocked}
        setupMode={sp.setup === "1"}
      />
    </div>
  );
}
