"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Bookmark,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Newspaper,
  NotebookPen,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { splitByQuery } from "@/lib/search/highlight";
import {
  clearRecentTickers,
  pushRecentTicker,
  readRecentTickers,
  removeRecentTicker,
} from "@/lib/search/recent-tickers";
import type {
  SearchCallResult,
  SearchHeadlineResult,
  SearchJournalEntryResult,
  SearchMemberResult,
  SearchPageResult,
  SearchSymbolResult,
  WorkspaceSearchResults,
} from "@/lib/search/types";

type PaletteItem =
  | { kind: "symbol"; data: SearchSymbolResult }
  | { kind: "member"; data: SearchMemberResult }
  | { kind: "page"; data: SearchPageResult }
  | { kind: "headline"; data: SearchHeadlineResult }
  | { kind: "journal"; data: SearchJournalEntryResult }
  | { kind: "call"; data: SearchCallResult };

type WorkspaceSearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const WorkspaceSearchContext = createContext<WorkspaceSearchContextValue | null>(null);

function useWorkspaceSearch() {
  const ctx = useContext(WorkspaceSearchContext);
  if (!ctx) {
    throw new Error("WorkspaceSearch components must be used within WorkspaceSearchProvider");
  }
  return ctx;
}

function AssetBadge({ assetClass }: { assetClass: "equity" | "crypto" }) {
  const crypto = assetClass === "crypto";
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        crypto ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"
      )}
    >
      {crypto ? "Crypto" : "Stock"}
    </span>
  );
}

export function WorkspaceSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <WorkspaceSearchContext.Provider value={value}>
      {children}
      <WorkspaceCommandPalette open={open} onOpenChange={setOpen} />
    </WorkspaceSearchContext.Provider>
  );
}

export function WorkspaceSearchTrigger({ className }: { className?: string }) {
  const { setOpen } = useWorkspaceSearch();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-8 min-w-[5.25rem] flex-1 items-center justify-center gap-1.5 rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2 text-xs text-[var(--pf-gray-500)] shadow-[var(--pf-shadow-sm)] transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-surface)] sm:hidden",
          className
        )}
        aria-label="Search workspace"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
        <span className="whitespace-nowrap">Search</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "hidden h-9 w-full max-w-md items-center gap-2.5 rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 text-sm text-[var(--pf-gray-500)] shadow-[var(--pf-shadow-sm)] transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-surface)] sm:flex",
          className
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
        <span className="flex-1 truncate text-left">Search symbols, journal, news…</span>
      </button>
    </>
  );
}

function WorkspaceCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WorkspaceSearchResults | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [recentSeed, setRecentSeed] = useState<string[]>([]);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setResults(null);
    setActiveIndex(0);
  }, [onOpenChange]);

  const resultSections = useMemo(() => {
    if (!results) return [] as { title: string; items: PaletteItem[] }[];

    const sections: { title: string; items: PaletteItem[] }[] = [];

    if (results.recent.length > 0) {
      sections.push({
        title: "Recent",
        items: results.recent.map((data) => ({ kind: "symbol" as const, data })),
      });
    }
    if (results.symbols.length > 0) {
      sections.push({
        title: "Symbols",
        items: results.symbols.map((data) => ({ kind: "symbol" as const, data })),
      });
    }
    if (results.headlines.length > 0) {
      sections.push({
        title: "Headlines",
        items: results.headlines.map((data) => ({ kind: "headline" as const, data })),
      });
    }
    if (results.journalEntries.length > 0) {
      sections.push({
        title: "Journal",
        items: results.journalEntries.map((data) => ({ kind: "journal" as const, data })),
      });
    }
    if (results.calls.length > 0) {
      sections.push({
        title: "Calls",
        items: results.calls.map((data) => ({ kind: "call" as const, data })),
      });
    }
    if (results.members.length > 0) {
      sections.push({
        title: "Members",
        items: results.members.map((data) => ({ kind: "member" as const, data })),
      });
    }
    if (results.pages.length > 0) {
      sections.push({
        title: !query.trim() ? "Quick links" : "Pages",
        items: results.pages.map((data) => ({ kind: "page" as const, data })),
      });
    }

    return sections;
  }, [results, query]);

  const items = useMemo(
    () => resultSections.flatMap((section) => section.items),
    [resultSections]
  );

  const sectionOffsets = useMemo(() => {
    let running = 0;
    return resultSections.map((section) => {
      const offset = running;
      running += section.items.length;
      return offset;
    });
  }, [resultSections]);

  useEffect(() => {
    if (!open) return;
    setRecentSeed(readRecentTickers().map((row) => row.symbol));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q: query });
      if (!query.trim() && recentSeed.length > 0) {
        params.set("recent", recentSeed.join(","));
      }
      void fetch(`/api/search?${params}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error("search_failed");
          return (await res.json()) as WorkspaceSearchResults;
        })
        .then((data) => {
          setResults(data);
          setActiveIndex(0);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setResults({
            query,
            recent: [],
            symbols: [],
            journalEntries: [],
            calls: [],
            members: [],
            pages: [],
            headlines: [],
          });
        })
        .finally(() => setLoading(false));
    }, query ? 180 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, recentSeed]);

  useEffect(() => {
    setActiveIndex((prev) => (items.length === 0 ? 0 : Math.min(prev, items.length - 1)));
  }, [items.length]);

  function clearAllRecents() {
    clearRecentTickers();
    setRecentSeed([]);
    setResults((prev) => (prev ? { ...prev, recent: [] } : prev));
  }

  function removeRecent(symbol: string) {
    removeRecentTicker(symbol);
    setRecentSeed((prev) => prev.filter((s) => s !== symbol));
    setResults((prev) =>
      prev ? { ...prev, recent: prev.recent.filter((row) => row.symbol !== symbol) } : prev
    );
  }

  function navigateSymbol(item: SearchSymbolResult) {
    pushRecentTicker({ symbol: item.symbol, assetClass: item.assetClass });
    close();
    router.push(item.href);
  }

  function navigate(href: string) {
    close();
    router.push(href);
  }

  function openHeadline(url: string) {
    close();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function activateItem(item: PaletteItem) {
    if (item.kind === "symbol") navigateSymbol(item.data);
    else if (item.kind === "headline") openHeadline(item.data.url);
    else navigate(item.data.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (items.length === 0 ? 0 : (prev + 1) % items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (items.length === 0 ? 0 : (prev - 1 + items.length) % items.length));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      activateItem(items[activeIndex]);
    }
  }

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  const emptyQuery = !query.trim();
  const hasResults = items.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[var(--pf-black)]/45 p-3 pt-[max(0.75rem,var(--pf-safe-top))] backdrop-blur-[2px] sm:p-6 sm:pt-[min(12vh,6rem)]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search workspace"
        className="pf-popover-panel flex max-h-[min(32rem,calc(100dvh-1.5rem))] w-full max-w-xl flex-col overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[var(--pf-border)] px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search…"
            className="min-w-0 flex-1 bg-transparent text-base text-[var(--pf-black)] outline-none placeholder:text-[var(--pf-gray-400)] sm:text-sm"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--pf-gray-400)]" />
          ) : (
            <button
              type="button"
              onClick={close}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-100)]"
            >
              Esc
            </button>
          )}
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {loading && !results ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--pf-gray-400)]" />
            </div>
          ) : null}

          {!hasResults && !loading && results ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-medium text-[var(--pf-gray-700)]">
                {emptyQuery ? "Jump anywhere in your workspace" : "No matches"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
                {emptyQuery
                  ? "Try NVDA, @username, or earnings in your journal."
                  : "Check the symbol, try @ before a username, or search journal notes and theses (2+ letters)."}
              </p>
            </div>
          ) : null}

          {resultSections.map((section, sectionIndex) => {
            const indexOffset = sectionOffsets[sectionIndex] ?? 0;
            const isRecentSection = section.title === "Recent";

            return (
              <ResultSection
                key={section.title}
                title={section.title}
                action={
                  isRecentSection && section.items.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearAllRecents}
                      className="text-[10px] font-semibold normal-case tracking-normal text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-black)]"
                    >
                      Clear
                    </button>
                  ) : null
                }
              >
                {section.items.map((item, i) => {
                  const index = indexOffset + i;
                  if (item.kind === "symbol") {
                    return (
                      <SymbolRow
                        key={`${section.title}-${item.data.symbol}`}
                        item={item.data}
                        dataIndex={index}
                        active={activeIndex === index}
                        onHover={() => setActiveIndex(index)}
                        onPick={() => navigateSymbol(item.data)}
                        onRemove={
                          isRecentSection ? () => removeRecent(item.data.symbol) : undefined
                        }
                        onIntel={() => {
                          pushRecentTicker({
                            symbol: item.data.symbol,
                            assetClass: item.data.assetClass,
                          });
                          close();
                          router.push(item.data.intelHref);
                        }}
                      />
                    );
                  }
                  if (item.kind === "headline") {
                    return (
                      <HeadlineRow
                        key={`headline-${item.data.id}`}
                        item={item.data}
                        query={query}
                        dataIndex={index}
                        active={activeIndex === index}
                        onHover={() => setActiveIndex(index)}
                        onPick={() => openHeadline(item.data.url)}
                      />
                    );
                  }
                  if (item.kind === "journal") {
                    return (
                      <JournalEntryRow
                        key={`journal-${item.data.id}`}
                        item={item.data}
                        query={query}
                        dataIndex={index}
                        active={activeIndex === index}
                        onHover={() => setActiveIndex(index)}
                        onPick={() => navigate(item.data.href)}
                      />
                    );
                  }
                  if (item.kind === "call") {
                    return (
                      <CallRow
                        key={`call-${item.data.id}`}
                        item={item.data}
                        query={query}
                        dataIndex={index}
                        active={activeIndex === index}
                        onHover={() => setActiveIndex(index)}
                        onPick={() => navigate(item.data.href)}
                      />
                    );
                  }
                  if (item.kind === "member") {
                    return (
                      <button
                        key={`mem-${item.data.username}`}
                        type="button"
                        data-index={index}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => navigate(item.data.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          activeIndex === index
                            ? "bg-[var(--pf-gray-100)]"
                            : "hover:bg-[var(--pf-gray-50)]"
                        )}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--pf-black)]">
                            {item.data.displayName ?? item.data.username}
                          </span>
                          <span className="block truncate font-mono text-xs text-[var(--pf-gray-500)]">
                            @{item.data.username}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={`page-${item.data.href}`}
                      type="button"
                      data-index={index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => navigate(item.data.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        activeIndex === index
                          ? "bg-[var(--pf-gray-100)]"
                          : "hover:bg-[var(--pf-gray-50)]"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]">
                        <LayoutDashboard className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--pf-black)]">
                          {item.data.label}
                        </span>
                        <span className="block truncate text-xs text-[var(--pf-gray-500)]">
                          {item.data.description}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
                    </button>
                  );
                })}
              </ResultSection>
            );
          })}
        </div>

        <div className="border-t border-[var(--pf-border)] px-4 py-2.5 text-[11px] text-[var(--pf-gray-500)]">
          <span className="hidden sm:inline">
            ↑↓ navigate · Enter open · Esc close
            {results?.symbols.some((s) => s.onWatchlist) ? " · Watchlist opens Journal" : ""}
          </span>
          <span className="sm:hidden">Tap a result to open</span>
        </div>
      </div>
    </div>
  );
}

function ResultSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-2">
      <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]">
          {title}
        </p>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitByQuery(text, query).map((segment, i) =>
        segment.highlight ? (
          <mark
            key={i}
            className="rounded-sm bg-amber-100 px-0.5 font-semibold text-[var(--pf-black)]"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </>
  );
}

function SymbolRow({
  item,
  dataIndex,
  active,
  onHover,
  onPick,
  onIntel,
  onRemove,
}: {
  item: SearchSymbolResult;
  dataIndex: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
  onIntel: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      data-index={dataIndex}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
        active ? "bg-[var(--pf-gray-100)]" : "hover:bg-[var(--pf-gray-50)]"
      )}
    >
      <button type="button" onClick={onPick} className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)]/10 font-mono text-xs font-bold text-[var(--pf-red)]">
          {item.symbol.slice(0, 3)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-[var(--pf-black)]">{item.symbol}</span>
            <AssetBadge assetClass={item.assetClass} />
            {item.onWatchlist ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                <Bookmark className="h-3 w-3" aria-hidden />
                Watchlist
              </span>
            ) : null}
          </span>
          {item.name ? (
            <span className="mt-0.5 block truncate text-xs text-[var(--pf-gray-500)]">{item.name}</span>
          ) : null}
        </span>
        {item.lastPrice != null ? (
          <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-[var(--pf-black)]">
            ${formatPrice(item.lastPrice)}
          </span>
        ) : null}
        <span className="shrink-0 text-xs font-semibold text-[var(--pf-gray-600)]">
          {item.onWatchlist ? "Journal" : "Intel"}
        </span>
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 rounded-md p-1.5 text-[var(--pf-gray-400)] transition-colors hover:bg-[var(--pf-surface)] hover:text-[var(--pf-black)]"
          aria-label={`Remove ${item.symbol} from recent`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {item.onWatchlist ? (
        <button
          type="button"
          onClick={onIntel}
          className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--pf-gray-500)] hover:bg-[var(--pf-surface)] hover:text-[var(--pf-black)]"
          title="Open community intel page"
        >
          Intel
        </button>
      ) : null}
    </div>
  );
}

function HeadlineRow({
  item,
  query,
  dataIndex,
  active,
  onHover,
  onPick,
}: {
  item: SearchHeadlineResult;
  query: string;
  dataIndex: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const age =
    item.datetime > 0
      ? formatDistanceToNow(new Date(item.datetime * 1000), { addSuffix: true })
      : null;

  return (
    <button
      type="button"
      data-index={dataIndex}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        active ? "bg-[var(--pf-gray-100)]" : "hover:bg-[var(--pf-gray-50)]"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]">
        <Newspaper className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-medium leading-snug text-[var(--pf-black)]">
          <HighlightedText text={item.headline} query={query} />
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--pf-gray-500)]">
          <span className="truncate">{item.source}</span>
          {age ? <span className="shrink-0">{age}</span> : null}
          {item.relatedSymbols.length > 0 ? (
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              {item.relatedSymbols.slice(0, 3).join(" · ")}
            </span>
          ) : null}
        </span>
      </span>
      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
    </button>
  );
}

function JournalEntryRow({
  item,
  query,
  dataIndex,
  active,
  onHover,
  onPick,
}: {
  item: SearchJournalEntryResult;
  query: string;
  dataIndex: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const age =
    item.createdAt.length > 0
      ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
      : null;

  return (
    <button
      type="button"
      data-index={dataIndex}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        active ? "bg-[var(--pf-gray-100)]" : "hover:bg-[var(--pf-gray-50)]"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]">
        <NotebookPen className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-xs font-bold text-[var(--pf-red)]">{item.symbol}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            {item.entryTypeLabel}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-[var(--pf-black)]">
          <HighlightedText text={item.body} query={query} />
        </span>
        {age ? (
          <span className="mt-1 block text-xs text-[var(--pf-gray-500)]">{age}</span>
        ) : null}
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
    </button>
  );
}

function CallRow({
  item,
  query,
  dataIndex,
  active,
  onHover,
  onPick,
}: {
  item: SearchCallResult;
  query: string;
  dataIndex: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const age =
    item.calledAt.length > 0
      ? formatDistanceToNow(new Date(item.calledAt), { addSuffix: true })
      : null;

  return (
    <button
      type="button"
      data-index={dataIndex}
      onMouseEnter={onHover}
      onClick={onPick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        active ? "bg-[var(--pf-gray-100)]" : "hover:bg-[var(--pf-gray-50)]"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]">
        <Megaphone className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-xs font-bold text-[var(--pf-red)]">{item.symbol}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
              item.direction === "long"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-800"
            )}
          >
            {item.direction}
          </span>
          <span className="text-xs text-[var(--pf-gray-500)]">{item.authorLabel}</span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-[var(--pf-black)]">
          <HighlightedText text={item.thesis} query={query} />
        </span>
        {age ? (
          <span className="mt-1 block text-xs text-[var(--pf-gray-500)]">{age}</span>
        ) : null}
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
    </button>
  );
}
