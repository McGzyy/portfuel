"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchHelpDocs, type HelpSearchHit } from "@/lib/help/search";
import { splitByQuery } from "@/lib/search/highlight";
import { cn } from "@/lib/utils";

function kindLabel(kind: HelpSearchHit["kind"]): string {
  if (kind === "faq") return "FAQ";
  if (kind === "article") return "Article";
  return "Guide";
}

export function HelpSearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const hits = useMemo(() => searchHelpDocs(query, 10), [query]);
  const showResults = open && query.trim().length >= 2;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, hits.length]);

  useEffect(() => {
    if (!showResults) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showResults]);

  function pick(hit: HelpSearchHit) {
    setQuery("");
    setOpen(false);
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!showResults || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter" && hits[activeIndex]) {
      e.preventDefault();
      pick(hits[activeIndex]);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="pf-workspace-panel flex items-center gap-2.5 px-3 py-2.5 sm:px-4">
        <Search className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" strokeWidth={2.25} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Search help docs…"
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--pf-gray-400)]"
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="rounded-md p-1 text-[var(--pf-gray-400)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-gray-600)]"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showResults ? (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-20 max-h-72 overflow-y-auto rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-surface)] shadow-lg"
        >
          {hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--pf-gray-500)]">
              No help articles match &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            hits.map((hit, index) => (
              <button
                key={hit.href}
                type="button"
                data-index={index}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(hit)}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b border-[var(--pf-border)] px-4 py-3 text-left last:border-b-0",
                  activeIndex === index ? "bg-[var(--pf-gray-50)]" : "hover:bg-[var(--pf-gray-50)]"
                )}
              >
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {splitByQuery(hit.title, query).map((part, i) =>
                    part.highlight ? (
                      <mark
                        key={i}
                        className="rounded bg-[var(--pf-red-muted)] px-0.5 text-inherit"
                      >
                        {part.text}
                      </mark>
                    ) : (
                      <span key={i}>{part.text}</span>
                    )
                  )}
                </span>
                <span className="text-xs text-[var(--pf-gray-500)]">
                  {kindLabel(hit.kind)} · {hit.sectionLabel}
                </span>
                <span className="line-clamp-2 text-xs leading-relaxed text-[var(--pf-gray-500)]">
                  {hit.snippet.slice(0, 140)}
                  {hit.snippet.length > 140 ? "…" : ""}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
