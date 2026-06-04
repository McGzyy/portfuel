"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWorkspaceGuideSections } from "@/lib/dashboard/nav";

const GUIDE_SEEN_KEY = "pf_workspace_guide_seen";

export function WorkspaceGuide({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const sections = buildWorkspaceGuideSections(username);

  useEffect(() => {
    try {
      if (localStorage.getItem(GUIDE_SEEN_KEY) !== "1") {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function dismissGuide() {
    try {
      localStorage.setItem(GUIDE_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-black)]"
      >
        <Map className="h-3.5 w-3.5" />
        Help
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workspace-guide-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-lg)]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--pf-border)] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                  Workspace map
                </p>
                <h2 id="workspace-guide-title" className="mt-1 text-lg font-bold text-[var(--pf-black)]">
                  Find your way around
                </h2>
              </div>
              <button
                type="button"
                onClick={dismissGuide}
                className="rounded-lg p-1 text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-100)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--pf-gray-400)]">
                    {section.title}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={dismissGuide}
                          className="block rounded-lg border border-[var(--pf-border)] px-3 py-2.5 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]"
                        >
                          <span className="text-sm font-semibold text-[var(--pf-black)]">
                            {item.label}
                          </span>
                          <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
                            {item.description}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--pf-border)] px-5 py-4 space-y-3">
              <p className="text-center text-xs text-[var(--pf-gray-500)]">
                New here? Finish the launch checklist on{" "}
                <Link
                  href="/dashboard"
                  className="font-semibold text-[var(--pf-red)] hover:underline"
                  onClick={dismissGuide}
                >
                  Overview
                </Link>
                .
              </p>
              <Button className="w-full" size="sm" onClick={dismissGuide}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
