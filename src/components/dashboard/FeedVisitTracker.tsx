"use client";

import { useEffect } from "react";
import { FEED_SEEN_COOKIE } from "@/lib/feed/last-seen";

const MAX_AGE_SEC = 60 * 60 * 24 * 30;

/** Updates feed seen cookie when leaving the feed so the next visit can show "new" badges. */
export function FeedVisitTracker() {
  useEffect(() => {
    const markSeen = () => {
      const value = String(Date.now());
      document.cookie = `${FEED_SEEN_COOKIE}=${value};path=/;max-age=${MAX_AGE_SEC};SameSite=Lax`;
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
