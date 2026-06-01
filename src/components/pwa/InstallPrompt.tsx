"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Safari-style share glyph (square + arrow up) for the iOS install hint. */
function IosShareGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 2.5v6" />
      <path d="M5.5 4.25 8 1.75 10.5 4.25" />
      <rect x="3.25" y="7" width="9.5" height="6.75" rx="1.25" />
    </svg>
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    if (isIos()) setShowIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
    setDismissed(true);
  }, [deferred]);

  if (isStandalone() || dismissed) return null;

  if (showIosHint && !deferred) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-2.5 text-center text-xs text-[var(--pf-gray-600)]">
        <span>Install: tap</span>
        <span className="inline-flex items-center gap-0.5 rounded border border-[var(--pf-gray-300)] bg-white px-1.5 py-0.5 font-semibold text-[var(--pf-black)] shadow-sm">
          <IosShareGlyph className="h-3.5 w-3.5 shrink-0" />
          Share
        </span>
        <span aria-hidden>→</span>
        <strong className="text-[var(--pf-gray-700)]">Add to Home Screen</strong>
        <button
          type="button"
          className="ml-2 font-semibold text-[var(--pf-red)]"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!deferred) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-b border-[var(--pf-border)] bg-[var(--pf-red-muted)] px-4 py-2.5 text-sm">
      <span className="text-[var(--pf-gray-700)]">Install PortFuel for quick access</span>
      <button
        type="button"
        className="rounded-md bg-[var(--pf-red)] px-3 py-1.5 text-xs font-semibold text-white"
        onClick={install}
      >
        Install app
      </button>
      <button
        type="button"
        className="text-xs font-medium text-[var(--pf-gray-500)]"
        onClick={() => setDismissed(true)}
      >
        Not now
      </button>
    </div>
  );
}
