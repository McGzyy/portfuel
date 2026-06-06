import { redirect } from "next/navigation";
import { journalSymbolPath } from "@/lib/journal/paths";

/** Legacy URL — journal lives under /dashboard/journal/[symbol]. */
export default async function LegacyWatchlistJournalRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ setup?: string }>;
}) {
  const { symbol } = await params;
  const sp = await searchParams;
  redirect(journalSymbolPath(symbol, sp.setup === "1" ? { setup: true } : undefined));
}
