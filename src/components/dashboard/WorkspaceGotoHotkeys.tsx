"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  WORKSPACE_ACTION_ROUTES,
  WORKSPACE_GOTO_ROUTES,
} from "@/lib/workspace/shortcuts";

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

/** G then letter navigation; N then C publish call. */
export function WorkspaceGotoHotkeys() {
  const router = useRouter();
  const pendingRef = useRef<"g" | "n" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearPending() {
      pendingRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (pendingRef.current === "g") {
        e.preventDefault();
        const href = WORKSPACE_GOTO_ROUTES[key];
        clearPending();
        if (href) router.push(href);
        return;
      }

      if (pendingRef.current === "n") {
        e.preventDefault();
        const href = WORKSPACE_ACTION_ROUTES[key];
        clearPending();
        if (href) router.push(href);
        return;
      }

      if (key === "g") {
        e.preventDefault();
        pendingRef.current = "g";
        timerRef.current = setTimeout(clearPending, 1200);
        return;
      }

      if (key === "n") {
        e.preventDefault();
        pendingRef.current = "n";
        timerRef.current = setTimeout(clearPending, 1200);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearPending();
    };
  }, [router]);

  return null;
}
