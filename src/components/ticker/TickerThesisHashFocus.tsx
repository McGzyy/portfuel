"use client";

import { useEffect } from "react";

/** Scroll to and highlight a community thesis when the URL hash is #thesis-{callId}. */
export function TickerThesisHashFocus() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#thesis-")) return;

    const callId = decodeURIComponent(hash.slice("#thesis-".length));
    if (!callId) return;

    const id = window.requestAnimationFrame(() => {
      const el = document.getElementById(`thesis-${callId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("pf-thesis-highlight");
      window.setTimeout(() => el.classList.remove("pf-thesis-highlight"), 2200);
    });

    return () => window.cancelAnimationFrame(id);
  }, []);

  return null;
}
