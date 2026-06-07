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
import {
  ArrowRight,
  Bookmark,
  LayoutDashboard,
  Loader2,
  Search,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SearchMemberResult,
  SearchPageResult,
  SearchSymbolResult,
  WorkspaceSearchResults,
} from "@/lib/search/types";

type PaletteItem =
  | { kind: "symbol"; data: SearchSymbolResult }
  | { kind: "member"; data: SearchMemberResult }
  | { kind: "page"; data: SearchPageResult };

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

function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
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

function ShortcutHint() {
  const mac = isMacPlatform();
  return (
    <kbd className="hidden shrink-0 rounded border border-[var(--pf-border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[var(--pf-gray-500)] sm:inline">
      {mac ? "⌘K" : "Ctrl K"}
    </kbd>
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
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[var(--pf-gray-600)] shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-white sm:hidden",
          className
        )}
        aria-label="Search workspace"
      >
        <Search className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "hidden h-9 w-full max-w-md items-center gap-2.5 rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 text-sm text-[var(--pf-gray-500)] shadow-[var(--pf-shadow-sm)] transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white sm:flex",
          className
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
        <span className="flex-1 truncate text-left">Search symbols, members, pages…</span>
        <ShortcutHint />
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

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setResults(null);
    setActiveIndex(0);
  }, [onOpenChange]);

  const items = useMemo((): PaletteItem[] => {
    if (!results) return [];
    return [
      ...results.symbols.map((data) => ({ kind: "symbol" as const, data })),
      ...results.members.map((data) => ({ kind: "member" as const, data })),
      ...results.pages.map((data) => ({ kind: "page" as const, data })),
    ];
  }, [results]);

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
      void fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
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
          setResults({ query, symbols: [], members: [], pages: [] });
        })
        .finally(() => setLoading(false));
    }, query ? 180 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  useEffect(() => {
    setActiveIndex((prev) => (items.length === 0 ? 0 : Math.min(prev, items.length - 1)));
  }, [items.length]);

  function navigate(href: string) {
    close();
    router.push(href);
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
      const item = items[activeIndex];
      if (item.kind === "symbol") navigate(item.data.href);
      else if (item.kind === "member") navigate(item.data.href);
      else navigate(item.data.href);
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
        className="flex max-h-[min(32rem,calc(100dvh-1.5rem))] w-full max-w-xl flex-col overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[var(--pf-border)] px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Symbol, @member, or page…"
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
                  ? "Try NVDA, @username, or journal. Headlines search is coming soon."
                  : "Check the symbol, try @ before a username, or search a page like watchlist."}
              </p>
            </div>
          ) : null}

          {results && results.symbols.length > 0 ? (
            <ResultSection title="Symbols">
              {results.symbols.map((item, i) => (
                <SymbolRow
                  key={`sym-${item.symbol}`}
                  item={item}
                  dataIndex={i}
                  active={activeIndex === i}
                  onHover={() => setActiveIndex(i)}
                  onPick={() => navigate(item.href)}
                  onIntel={() => navigate(item.intelHref)}
                />
              ))}
            </ResultSection>
          ) : null}

          {results && results.members.length > 0 ? (
            <ResultSection title="Members">
              {results.members.map((item, i) => {
                const index = (results?.symbols.length ?? 0) + i;
                return (
                  <button
                    key={`mem-${item.username}`}
                    type="button"
                    data-index={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      activeIndex === index ? "bg-[var(--pf-gray-100)]" : "hover:bg-[var(--pf-gray-50)]"
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--pf-black)]">
                        {item.displayName ?? item.username}
                      </span>
                      <span className="block truncate font-mono text-xs text-[var(--pf-gray-500)]">
                        @{item.username}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
                  </button>
                );
              })}
            </ResultSection>
          ) : null}

          {results && results.pages.length > 0 ? (
            <ResultSection title={emptyQuery ? "Quick links" : "Pages"}>
              {results.pages.map((item, i) => {
                const index =
                  (results?.symbols.length ?? 0) + (results?.members.length ?? 0) + i;
                return (
                  <button
                    key={`page-${item.href}`}
                    type="button"
                    data-index={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      activeIndex === index ? "bg-[var(--pf-gray-100)]" : "hover:bg-[var(--pf-gray-50)]"
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]">
                      <LayoutDashboard className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--pf-black)]">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-[var(--pf-gray-500)]">
                        {item.description}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
                  </button>
                );
              })}
            </ResultSection>
          ) : null}
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

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-2">
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function SymbolRow({
  item,
  dataIndex,
  active,
  onHover,
  onPick,
  onIntel,
}: {
  item: SearchSymbolResult;
  dataIndex: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
  onIntel: () => void;
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
        <span className="shrink-0 text-xs font-semibold text-[var(--pf-gray-600)]">
          {item.onWatchlist ? "Journal" : "Intel"}
        </span>
      </button>
      {item.onWatchlist ? (
        <button
          type="button"
          onClick={onIntel}
          className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--pf-gray-500)] hover:bg-white hover:text-[var(--pf-black)]"
          title="Open community intel page"
        >
          Intel
        </button>
      ) : null}
    </div>
  );
}
