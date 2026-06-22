"use client";

import { useEffect } from "react";
import { RESEARCH_SEEN_COOKIE } from "@/lib/research/last-seen";

const MAX_AGE_SEC = 60 * 60 * 24 * 30;

/** Updates research hub seen cookie when leaving so nav can show new activity. */
export function ResearchVisitTracker() {
  useEffect(() => {
    const markSeen = () => {
      const value = String(Date.now());
      document.cookie = `${RESEARCH_SEEN_COOKIE}=${value};path=/;max-age=${MAX_AGE_SEC};SameSite=Lax`;
    };

    const onLeave = () => markSeen();
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      markSeen();
    };
  }, []);

  return null;
}
