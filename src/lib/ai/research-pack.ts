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
const MAX_WEB_SOURCES = 3;
const MAX_WEB_CHARS = 1200;

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

export type ResearchPackWebSource = {
  url: string;
  title?: string | null;
  text: string;
};

export type ResearchPack = {
  headlines: TickerAnalyzeHeadline[];
  earnings: ResearchPackEarningsRow[];
  filings: ResearchPackFilingRow[];
  webSources?: ResearchPackWebSource[];
  /** Serialized block injected into the AI prompt */
  promptBlock: string;
  /** Bumped when analysis prompts change — invalidates cached rows. */
  promptVersion?: number;
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
  webSources?: ResearchPackWebSource[];
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

  const webLines =
    input.webSources && input.webSources.length > 0
      ? input.webSources
          .map((w, i) => `Source ${i + 1}: ${w.url}\n${truncate(w.text, MAX_WEB_CHARS)}`)
          .join("\n\n")
      : "No web article text fetched.";

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

Web sources (max ${MAX_WEB_SOURCES}, truncated):
${webLines}

Admin note: ${input.adminNote?.trim() || "—"}`;
}

async function fetchReadableText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      // best-effort: cache for a while to reduce repeated hits
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "PortFuelBot/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // very simple HTML -> text; we only need a short snippet
    const noScript = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");
    const text = noScript
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return null;
    return text.slice(0, MAX_WEB_CHARS);
  } catch {
    return null;
  }
}

export async function buildTickerResearchPack(input: {
  symbol: string;
  assetClass: "equity" | "crypto";
  name?: string;
  lastPrice?: number;
  inPostSnippet: string;
  rawText: string;
  adminNote?: string;
  includeWeb?: boolean;
}): Promise<ResearchPack> {
  const symbol = input.symbol.toUpperCase();

  let headlines: TickerAnalyzeHeadline[] = [];
  let earnings: ResearchPackEarningsRow[] = [];
  let filings: ResearchPackFilingRow[] = [];
  let webSources: ResearchPackWebSource[] = [];

  if (input.assetClass === "equity") {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const [newsRaw, earningsRaw, filingsRaw] = await Promise.all([
      getCompanyNews(symbol, from, to),
      getEarnings(symbol),
      getFilings(symbol),
    ]);
    headlines = newsRaw.slice(0, MAX_HEADLINES).map(mapHeadline);
    const symbolFiltered = newsRaw.filter((n) => {
      const hay = `${n.headline} ${n.summary ?? ""}`.toUpperCase();
      return hay.includes(symbol) || hay.includes(`$${symbol}`);
    });
    if (symbolFiltered.length > 0) {
      headlines = symbolFiltered.slice(0, MAX_HEADLINES).map(mapHeadline);
    }
    earnings = earningsRaw.slice(0, MAX_EARNINGS).map(formatEarningsRow);
    filings = filingsRaw.slice(0, MAX_FILINGS).map(formatFilingRow);

    if (input.includeWeb) {
      const urls = headlines
        .map((h) => h.url)
        .filter((u) => typeof u === "string" && u.startsWith("http"))
        .slice(0, MAX_WEB_SOURCES);
      const texts = await Promise.all(urls.map((u) => fetchReadableText(u)));
      webSources = urls
        .map((u, i) => ({ url: u, text: texts[i] ?? "" }))
        .filter((w) => w.text.trim().length > 0);
    }
  }

  const promptBlock = buildPromptBlock({
    ...input,
    symbol,
    headlines,
    earnings,
    filings,
    webSources: input.includeWeb ? webSources : [],
  });

  return { headlines, earnings, filings, webSources: input.includeWeb ? webSources : [], promptBlock };
}
