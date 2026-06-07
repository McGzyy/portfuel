export type ResearchHubTab = "screener" | "earnings" | "compare" | "news";

export function parseResearchHubTab(raw: string | undefined): ResearchHubTab {
  if (raw === "earnings" || raw === "compare" || raw === "news") return raw;
  return "screener";
}

export function buildResearchHubHref(
  tab: ResearchHubTab = "screener",
  opts?: { symbols?: string; lane?: string }
): string {
  const params = new URLSearchParams();
  if (tab !== "screener") params.set("tab", tab);
  if (opts?.symbols?.trim()) params.set("symbols", opts.symbols.trim());
  if (opts?.lane?.trim() && tab === "news") params.set("lane", opts.lane.trim());
  const qs = params.toString();
  return qs ? `/dashboard/research?${qs}` : "/dashboard/research";
}

export const RESEARCH_HUB_TABS: { id: ResearchHubTab; label: string; description: string }[] = [
  {
    id: "screener",
    label: "Screener",
    description: "Community activity, target progress, and conviction filters.",
  },
  {
    id: "earnings",
    label: "Earnings",
    description: "Reporting week with member and Fueled desk positioning.",
  },
  {
    id: "compare",
    label: "Compare",
    description: "Chart two or three symbols side by side.",
  },
  {
    id: "news",
    label: "Headlines",
    description: "Macro, crypto, deals, and headlines relevant to your watchlist.",
  },
];
