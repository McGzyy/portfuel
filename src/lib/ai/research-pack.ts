import {
  getCompanyNews,
  getEarnings,
  getFilings,
  type CompanyNewsItem,
  type EarningsItem,
  type FilingItem,
} from "@/lib/market/finnhub";
import type { TickerAnalyzeHeadline } from "@/lib/ai/ticker-analyze";

const MAX_HEADLINES = 5;
const MAX_EARNINGS = 6;
const MAX_FILINGS = 5;
const MAX_POST_CHARS = 2800;

export type ResearchPackEarningsRow = {
  date: string;
  quarter: number | null;
  year: number | null;
  epsEstimate: number | null;
  epsActual: number | null;
};

export type ResearchPackFilingRow = {
  form: string;
  filedDate: string;
  reportUrl: string | null;
};

export type ResearchPack = {
  headlines: TickerAnalyzeHeadline[];
  earnings: ResearchPackEarningsRow[];
  filings: ResearchPackFilingRow[];
  /** Serialized block injected into the AI prompt */
  promptBlock: string;
};

function mapHeadline(n: CompanyNewsItem): TickerAnalyzeHeadline {
  return {
    headline: n.headline,
    summary: n.summary?.slice(0, 200) ?? "",
    source: n.source,
    url: n.url,
    datetime: n.datetime,
  };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function formatEarningsRow(e: EarningsItem): ResearchPackEarningsRow {
  return {
    date: e.date,
    quarter: e.quarter ?? null,
    year: e.year ?? null,
    epsEstimate: e.epsEstimate ?? null,
    epsActual: e.epsActual ?? null,
  };
}

function formatFilingRow(f: FilingItem): ResearchPackFilingRow {
  return {
    form: f.form,
    filedDate: f.filedDate,
    reportUrl: f.reportUrl ?? f.filingUrl ?? null,
  };
}

function buildPromptBlock(input: {
  symbol: string;
  name?: string;
  assetClass: "equity" | "crypto";
  lastPrice?: number;
  inPostSnippet: string;
  rawText: string;
  adminNote?: string;
  headlines: TickerAnalyzeHeadline[];
  earnings: ResearchPackEarningsRow[];
  filings: ResearchPackFilingRow[];
}): string {
  const headlineLines =
    input.headlines.length > 0
      ? input.headlines.map((h) => `- ${h.headline} (${h.source})`).join("\n")
      : input.assetClass === "crypto"
        ? "No Finnhub headlines for crypto — rely on post context only."
        : "No recent headlines in Finnhub window.";

  const earningsLines =
    input.earnings.length > 0
      ? input.earnings
          .map(
            (e) =>
              `- ${e.date} Q${e.quarter ?? "?"} ${e.year ?? ""}: est EPS ${e.epsEstimate ?? "—"}${e.epsActual != null ? `, actual ${e.epsActual}` : ""}`
          )
          .join("\n")
      : "No earnings rows returned.";

  const filingLines =
    input.filings.length > 0
      ? input.filings.map((f) => `- ${f.form} filed ${f.filedDate}`).join("\n")
      : input.assetClass === "crypto"
        ? "SEC filings N/A for crypto."
        : "No recent filings returned.";

  return `Symbol: ${input.symbol} (${input.name ?? input.symbol})
Asset class: ${input.assetClass}
Last price: ${input.lastPrice != null ? `$${input.lastPrice}` : "unknown"}

Post excerpt for this ticker:
${truncate(input.inPostSnippet, 500)}

Full post (truncated):
${truncate(input.rawText.trim(), MAX_POST_CHARS)}

Recent headlines (7d, max ${MAX_HEADLINES}):
${headlineLines}

Earnings (max ${MAX_EARNINGS}):
${earningsLines}

SEC filings (max ${MAX_FILINGS}):
${filingLines}

Admin note: ${input.adminNote?.trim() || "—"}`;
}

export async function buildTickerResearchPack(input: {
  symbol: string;
  assetClass: "equity" | "crypto";
  name?: string;
  lastPrice?: number;
  inPostSnippet: string;
  rawText: string;
  adminNote?: string;
}): Promise<ResearchPack> {
  const symbol = input.symbol.toUpperCase();

  let headlines: TickerAnalyzeHeadline[] = [];
  let earnings: ResearchPackEarningsRow[] = [];
  let filings: ResearchPackFilingRow[] = [];

  if (input.assetClass === "equity") {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const [newsRaw, earningsRaw, filingsRaw] = await Promise.all([
      getCompanyNews(symbol, from, to),
      getEarnings(symbol),
      getFilings(symbol),
    ]);
    headlines = newsRaw.slice(0, MAX_HEADLINES).map(mapHeadline);
    earnings = earningsRaw.slice(0, MAX_EARNINGS).map(formatEarningsRow);
    filings = filingsRaw.slice(0, MAX_FILINGS).map(formatFilingRow);
  }

  const promptBlock = buildPromptBlock({
    ...input,
    symbol,
    headlines,
    earnings,
    filings,
  });

  return { headlines, earnings, filings, promptBlock };
}
