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
      <div className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-2.5 text-center text-xs text-[var(--pf-gray-600)]">
        Install: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
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
