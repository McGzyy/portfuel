"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  WORKSPACE_SHORTCUT_GROUPS,
  WORKSPACE_SHORTCUTS_OPEN_EVENT,
  shortcutKeysForPlatform,
} from "@/lib/workspace/shortcuts";
import { cn } from "@/lib/utils";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function WorkspaceShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(WORKSPACE_SHORTCUTS_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(WORKSPACE_SHORTCUTS_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[92] flex items-end justify-center bg-[var(--pf-black)]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      style={{ paddingTop: "var(--pf-safe-top)", paddingBottom: "var(--pf-safe-bottom)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-shortcuts-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="pf-guide-modal flex max-h-[min(88dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--pf-border)] shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:rounded-[var(--pf-radius-lg)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--pf-border)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Reference
            </p>
            <h2
              id="workspace-shortcuts-title"
              className="mt-1 text-lg font-bold text-[var(--foreground)]"
            >
              Keyboard shortcuts
            </h2>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
              Press <kbd className="pf-kbd">?</kbd> anytime to toggle this panel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-100)]"
            aria-label="Close shortcuts"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {WORKSPACE_SHORTCUT_GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--pf-gray-400)]">
                {group.title}
              </h3>
              <ul className="mt-2 divide-y divide-[var(--pf-border)] rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/50">
                {group.items.map((item) => {
                  const keys = shortcutKeysForPlatform(item.keys);
                  return (
                    <li
                      key={item.label}
                      className="flex items-start justify-between gap-4 px-3 py-3 sm:px-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--pf-gray-500)]">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {keys.map((key, i) => (
                          <kbd key={`${item.label}-${i}`} className="pf-kbd">
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="shrink-0 border-t border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-5 py-3 text-center sm:px-6">
          <Link
            href="/dashboard/help"
            onClick={() => setOpen(false)}
            className={cn(
              "text-xs font-semibold text-[var(--pf-red)] hover:underline"
            )}
          >
            Help center →
          </Link>
        </div>
      </div>
    </div>
  );
}
