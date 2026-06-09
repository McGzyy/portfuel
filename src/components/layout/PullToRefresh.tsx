"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const PULL_THRESHOLD = 72;
const MAX_PULL = 108;

function isScrollAtTop(): boolean {
  return window.scrollY <= 2;
}

function isPullBlocked(): boolean {
  return document.body.style.overflow === "hidden";
}

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [mobile, setMobile] = useState(false);

  const pullRef = useRef(0);
  const startY = useRef(0);
  const startX = useRef(0);
  const pulling = useRef(false);
  const armed = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const resetPull = useCallback(() => {
    pullRef.current = 0;
    setPull(0);
    pulling.current = false;
    armed.current = false;
  }, []);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!mobile || refreshing || isPullBlocked()) return;
      if (!isScrollAtTop()) return;

      const touch = e.touches[0];
      if (!touch) return;

      startY.current = touch.clientY;
      startX.current = touch.clientX;
      pulling.current = true;
      armed.current = true;
    },
    [mobile, refreshing]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || !armed.current || refreshing) return;

      const touch = e.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - startY.current;
      const deltaX = touch.clientX - startX.current;

      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        armed.current = false;
        resetPull();
        return;
      }

      if (deltaY <= 0 || !isScrollAtTop()) {
        armed.current = false;
        resetPull();
        return;
      }

      e.preventDefault();
      const damped = Math.min(deltaY * 0.45, MAX_PULL);
      pullRef.current = damped;
      setPull(damped);
    },
    [refreshing, resetPull]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;

    const distance = pullRef.current;
    const shouldRefresh = armed.current && distance >= PULL_THRESHOLD;

    pulling.current = false;
    armed.current = false;

    if (!shouldRefresh) {
      resetPull();
      return;
    }

    setRefreshing(true);
    setPull(PULL_THRESHOLD * 0.55);
    try {
      router.refresh();
      await new Promise((resolve) => window.setTimeout(resolve, 450));
    } finally {
      setRefreshing(false);
      resetPull();
    }
  }, [router, resetPull]);

  useEffect(() => {
    if (!mobile) return;

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [mobile, onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pull / PULL_THRESHOLD, 1);
  const showIndicator = mobile && (pull > 0 || refreshing);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-40 flex justify-center lg:hidden",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: "calc(var(--pf-safe-top) + 3.5rem)",
          transform: `translateY(${refreshing ? 10 : Math.max(0, pull - 24)}px)`,
          transition: pulling.current ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
        }}
        aria-hidden={!showIndicator}
        aria-live="polite"
      >
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pf-border)] bg-[var(--pf-surface)] shadow-[var(--pf-shadow-sm)]",
            progress >= 1 && !refreshing && "border-[var(--pf-red)]/35"
          )}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4 text-[var(--pf-gray-500)] transition-colors",
              refreshing && "animate-spin text-[var(--pf-red)]",
              progress >= 1 && !refreshing && "text-[var(--pf-red)]"
            )}
            style={
              refreshing
                ? undefined
                : {
                    transform: `rotate(${progress * 220}deg)`,
                    opacity: 0.35 + progress * 0.65,
                  }
            }
            strokeWidth={2.25}
          />
        </div>
      </div>
      <div
        className={cn(!refreshing && pull > 0 && "transition-transform duration-200 ease-out")}
        style={{
          transform: pull > 0 && !refreshing ? `translateY(${pull * 0.2}px)` : undefined,
        }}
      >
        {children}
      </div>
    </>
  );
}
