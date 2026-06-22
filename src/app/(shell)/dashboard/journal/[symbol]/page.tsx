import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { fetchUserOpenCallOnSymbol } from "@/lib/calls/user-symbol-call";
import { fetchJournalEntries, fetchWatchlistJournal } from "@/lib/watchlist/journal";
import { fetchJournalPlanRevisions } from "@/lib/watchlist/journal-revisions";
import { normalizeJournalEntryType } from "@/lib/watchlist/journal-meta";
import type { JournalPrefillEntry } from "@/lib/journal/paths";

const PREFILL_ENTRIES = new Set<JournalPrefillEntry>([
  "note",
  "price_action",
  "earnings",
  "news",
  "thesis_update",
]);

function parsePrefillEntry(raw: string | undefined): JournalPrefillEntry | undefined {
  if (!raw) return undefined;
  const normalized = normalizeJournalEntryType(raw);
  return PREFILL_ENTRIES.has(normalized as JournalPrefillEntry)
    ? (normalized as JournalPrefillEntry)
    : undefined;
}

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
  searchParams: Promise<{ setup?: string; entry?: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const sp = await searchParams;
  const prefillEntry = parsePrefillEntry(sp.entry);
  const session = await requireDashboardSession();

  if (!isDemoMode() && !hasSupabaseConfig()) {
    notFound();
  }

  const journal = await fetchWatchlistJournal(session.userId, symbol);
  if (!journal) notFound();

  const [entries, revisions, intel, openCall] = await Promise.all([
    fetchJournalEntries(session.userId, symbol),
    fetchJournalPlanRevisions(session.userId, symbol),
    loadTickerIntel(symbol, { assetClass: journal.asset_class }).catch(() => null),
    fetchUserOpenCallOnSymbol(session.userId, symbol),
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
      <WatchlistJournalWorkspace
        journal={journal}
        entries={entries}
        revisions={revisions}
        intel={intelData}
        publishUrl={publishUrl}
        proUnlocked={proUnlocked}
        setupMode={sp.setup === "1"}
        prefillEntry={prefillEntry}
        hasOpenCall={Boolean(openCall)}
      />
    </div>
  );
}
