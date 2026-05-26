import { isDemoMode } from "@/lib/demo/config";
import { fetchDeskPortfolioForAdmin } from "@/lib/desk/portfolio";
import { getCompanyNews, type CompanyNewsItem } from "@/lib/market/finnhub";
import { isAiCoachConfigured } from "@/lib/ai/config";

export type DeskHeadline = {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
};

export type DeskSymbolResearch = {
  symbol: string;
  asset_class: "equity" | "crypto";
  direction: "long" | "short";
  status: "open" | "closed";
  headlines: DeskHeadline[];
  note?: string;
};

export type DeskWeekResearch = {
  weekLabel: string;
  symbols: DeskSymbolResearch[];
  finnhubConfigured: boolean;
  aiConfigured: boolean;
};

const RESEARCH_DAYS = 7;
const MAX_HEADLINES_PER_SYMBOL = 4;

function mapHeadline(n: CompanyNewsItem): DeskHeadline {
  return {
    headline: n.headline,
    summary: n.summary?.slice(0, 280) ?? "",
    source: n.source,
    url: n.url,
    datetime: n.datetime,
  };
}

function demoResearch(): DeskWeekResearch {
  return {
    weekLabel: "Last 7 days",
    finnhubConfigured: true,
    aiConfigured: isAiCoachConfigured(),
    symbols: [
      {
        symbol: "NVDA",
        asset_class: "equity",
        direction: "long",
        status: "open",
        headlines: [
          {
            headline: "Chip stocks in focus as data center demand stays in spotlight",
            summary: "Analysts debate sustainability of AI infrastructure spend.",
            source: "Demo",
            url: "https://example.com",
            datetime: Math.floor(Date.now() / 1000) - 86400,
          },
        ],
      },
      {
        symbol: "BTC",
        asset_class: "crypto",
        direction: "long",
        status: "open",
        headlines: [],
        note: "Finnhub company news is for equities — add crypto context manually in the thesis.",
      },
    ],
  };
}

export async function fetchDeskWeekResearch(): Promise<DeskWeekResearch> {
  if (isDemoMode()) return demoResearch();

  const finnhubConfigured = Boolean(process.env.FINNHUB_API_KEY?.trim());
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - RESEARCH_DAYS * 86400000).toISOString().slice(0, 10);

  const { entries } = await fetchDeskPortfolioForAdmin();
  const open = entries.filter((e) => e.status === "open");

  if (open.length === 0) {
    return {
      weekLabel: `Last ${RESEARCH_DAYS} days`,
      symbols: [],
      finnhubConfigured,
      aiConfigured: isAiCoachConfigured(),
    };
  }

  const symbols: DeskSymbolResearch[] = [];

  for (const entry of open) {
    if (entry.asset_class === "crypto") {
      symbols.push({
        symbol: entry.symbol,
        asset_class: "crypto",
        direction: entry.direction,
        status: entry.status,
        headlines: [],
        note: "No equity-style news feed for crypto — use manual bullets or general market context.",
      });
      continue;
    }

    if (!finnhubConfigured) {
      symbols.push({
        symbol: entry.symbol,
        asset_class: entry.asset_class,
        direction: entry.direction,
        status: entry.status,
        headlines: [],
        note: "FINNHUB_API_KEY not set — cannot load headlines.",
      });
      continue;
    }

    const raw = await getCompanyNews(entry.symbol, from, to);
    const headlines = raw
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, MAX_HEADLINES_PER_SYMBOL)
      .map(mapHeadline);

    symbols.push({
      symbol: entry.symbol,
      asset_class: entry.asset_class,
      direction: entry.direction,
      status: entry.status,
      headlines,
      note:
        headlines.length === 0
          ? "No headlines returned this week — symbol may be thin or API limit hit."
          : undefined,
    });
  }

  return {
    weekLabel: `Last ${RESEARCH_DAYS} days`,
    symbols,
    finnhubConfigured,
    aiConfigured: isAiCoachConfigured(),
  };
}

export function headlinesToBullets(symbols: DeskSymbolResearch[], forSymbol?: string): string {
  const list = forSymbol
    ? symbols.filter((s) => s.symbol.toUpperCase() === forSymbol.toUpperCase())
    : symbols;

  const lines: string[] = [];
  for (const s of list) {
    if (s.headlines.length === 0) {
      if (s.note) lines.push(`${s.symbol}: ${s.note}`);
      continue;
    }
    for (const h of s.headlines) {
      const date = new Date(h.datetime * 1000).toLocaleDateString();
      lines.push(
        `${s.symbol} (${date}, ${h.source}): ${h.headline}${h.summary ? ` — ${h.summary}` : ""}`
      );
    }
  }
  return lines.join("\n");
}
