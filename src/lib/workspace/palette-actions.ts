import type { ThemeMode } from "@/lib/appearance/types";
import { COPY } from "@/lib/copy";
import { dispatchOverviewLayoutOpen } from "@/lib/workspace/overview-layout";

export type PaletteActionId =
  | "new_call"
  | "mark_alerts_read"
  | "open_alerts"
  | "refresh_positions"
  | "toggle_theme"
  | "customize_overview"
  | "report"
  | "shortcuts"
  | "add_watchlist"
  | "open_journal"
  | "open_ticker";

export type PaletteActionItem = {
  id: PaletteActionId;
  label: string;
  description: string;
  symbol?: string;
};

type PaletteActionTemplate = {
  id: PaletteActionId;
  label: string;
  description: string;
  keywords: string[];
  global?: boolean;
};

const GLOBAL_ACTIONS: PaletteActionTemplate[] = [
  {
    id: "new_call",
    label: COPY.publishCallCta,
    description: "Open the publish form with entry, target, and stop.",
    keywords: ["publish", "call", "thesis", "new call", "nc"],
    global: true,
  },
  {
    id: "mark_alerts_read",
    label: "Mark all alerts read",
    description: "Clear unread badges in your alerts inbox.",
    keywords: ["mark", "read", "alerts", "notifications", "clear", "inbox"],
    global: true,
  },
  {
    id: "open_alerts",
    label: "Open alerts inbox",
    description: "Watchlist, social, support, and billing notifications.",
    keywords: ["alerts", "notifications", "inbox"],
    global: true,
  },
  {
    id: "refresh_positions",
    label: "Refresh open positions",
    description: "Update live return and progress on your open calls.",
    keywords: ["refresh", "quotes", "prices", "positions", "live", "book"],
    global: true,
  },
  {
    id: "toggle_theme",
    label: "Toggle theme",
    description: "Switch between light and dark workspace appearance.",
    keywords: ["dark", "light", "theme", "appearance", "mode"],
    global: true,
  },
  {
    id: "customize_overview",
    label: "Customize overview",
    description: "Focus presets, panel visibility, and density on your dashboard home.",
    keywords: ["layout", "overview", "panels", "focus", "trader", "researcher", "publisher", "customize"],
    global: true,
  },
  {
    id: "report",
    label: "Report an issue",
    description: "Open a support ticket about this page.",
    keywords: ["report", "bug", "support", "help", "ticket"],
    global: true,
  },
  {
    id: "shortcuts",
    label: "Keyboard shortcuts",
    description: "View all workspace navigation hotkeys.",
    keywords: ["shortcuts", "keyboard", "hotkeys", "?"],
    global: true,
  },
];

function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = text.toLowerCase();
  return hay.includes(q) || q.split(/\s+/).every((word) => word.length > 0 && hay.includes(word));
}

function matchesAction(action: PaletteActionTemplate, query: string): boolean {
  if (!query.trim()) return Boolean(action.global);
  return (
    matchesQuery(action.label, query) ||
    matchesQuery(action.description, query) ||
    action.keywords.some((k) => matchesQuery(k, query))
  );
}

/** Parse a bare ticker or simple command-style symbol from the palette query. */
export function parseTickerFromQuery(query: string): string | null {
  const q = query.trim();
  if (/^[A-Za-z]{1,12}$/.test(q)) return q.toUpperCase();
  const patterns = [
    /^add\s+([A-Za-z]{1,12})(?:\s+to\s+watchlist)?$/i,
    /^watchlist\s+([A-Za-z]{1,12})$/i,
    /^journal\s+([A-Za-z]{1,12})$/i,
    /^publish\s+(?:call\s+)?(?:on\s+)?([A-Za-z]{1,12})$/i,
    /^ticker\s+([A-Za-z]{1,12})$/i,
  ];
  for (const re of patterns) {
    const m = q.match(re);
    if (m?.[1]) return m[1].toUpperCase();
  }
  return null;
}

export function buildPaletteActionItems(opts: {
  query: string;
  symbol?: string | null;
  onWatchlist?: boolean;
  isDark?: boolean;
}): PaletteActionItem[] {
  const q = opts.query.trim();
  const items: PaletteActionItem[] = [];

  for (const action of GLOBAL_ACTIONS) {
    if (!matchesAction(action, q)) continue;
    if (action.id === "toggle_theme") {
      items.push({
        id: action.id,
        label: opts.isDark ? "Switch to light mode" : "Switch to dark mode",
        description: action.description,
      });
      continue;
    }
    items.push({
      id: action.id,
      label: action.label,
      description: action.description,
    });
  }

  const sym = opts.symbol?.toUpperCase() ?? null;
  if (sym) {
    const symLower = sym.toLowerCase();
    const symbolQueryMatch =
      !q ||
      symLower.includes(q.toLowerCase()) ||
      q.toLowerCase().includes(symLower) ||
      /^(add|watchlist|journal|publish|ticker)\b/i.test(q);

    if (symbolQueryMatch) {
      if (opts.onWatchlist) {
        items.push({
          id: "open_journal",
          label: `Open ${sym} journal`,
          description: "Private research notebook for this symbol.",
          symbol: sym,
        });
      } else {
        items.push({
          id: "add_watchlist",
          label: `Add ${sym} to watchlist`,
          description: "Track the symbol and start a private journal.",
          symbol: sym,
        });
      }
      items.push({
        id: "open_ticker",
        label: `Open ${sym} ticker page`,
        description: "Chart, community calls, and intel.",
        symbol: sym,
      });
    }
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.id}:${item.symbol ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type PaletteActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

export async function runPaletteAction(
  action: PaletteActionItem,
  ctx: {
    pathname: string;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
  }
): Promise<PaletteActionResult> {
  switch (action.id) {
    case "new_call":
      return { ok: true };
    case "mark_alerts_read": {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) return { ok: false, error: "Could not mark alerts read" };
      window.dispatchEvent(new Event("portfuel:notifications-unread-changed"));
      return { ok: true, message: "All alerts marked read" };
    }
    case "open_alerts":
      return { ok: true };
    case "refresh_positions": {
      const res = await fetch("/api/workspace/live-book", { method: "POST" });
      if (!res.ok) return { ok: false, error: "Quote refresh failed" };
      return { ok: true, message: "Open positions updated" };
    }
    case "toggle_theme": {
      await ctx.setThemeMode(ctx.isDark ? "light" : "dark");
      return {
        ok: true,
        message: ctx.isDark ? "Switched to light mode" : "Switched to dark mode",
      };
    }
    case "customize_overview": {
      dispatchOverviewLayoutOpen();
      return { ok: true, message: "Overview layout opened" };
    }
    case "report":
      return { ok: true };
    case "shortcuts":
      return { ok: true };
    case "add_watchlist": {
      if (!action.symbol) return { ok: false, error: "No symbol" };
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: action.symbol }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data.error === "watchlist_full"
            ? "Watchlist is full"
            : "Could not add to watchlist";
        return { ok: false, error: msg };
      }
      return { ok: true, message: `${action.symbol} added to watchlist` };
    }
    case "open_journal":
    case "open_ticker":
      return { ok: true };
    default:
      return { ok: false, error: "Unknown action" };
  }
}

export function paletteActionHref(
  action: PaletteActionItem,
  pathname: string
): string | null {
  switch (action.id) {
    case "new_call":
      return COPY.newCallHref;
    case "open_alerts":
      return "/dashboard/notifications";
    case "customize_overview":
      return "/dashboard";
    case "report":
      return `/dashboard/help?view=tickets&new=1&from=${encodeURIComponent(pathname)}`;
    case "open_journal":
      return action.symbol ? `/dashboard/journal/${action.symbol}` : null;
    case "open_ticker":
      return action.symbol ? `/ticker/${action.symbol}` : null;
    case "add_watchlist":
      return action.symbol ? `/dashboard/journal/${action.symbol}` : null;
    default:
      return null;
  }
}
