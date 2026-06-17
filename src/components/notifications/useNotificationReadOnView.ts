"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { UserNotification } from "@/lib/notifications/types";

function isVisibleInScrollContainer(el: HTMLElement, container: HTMLElement): boolean {
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return elRect.bottom > containerRect.top + 1 && elRect.top < containerRect.bottom - 1;
}

type Options = {
  active: boolean;
  items: UserNotification[];
  scrollRef: RefObject<HTMLElement | null>;
  itemRefs: RefObject<Map<string, HTMLElement>>;
  onMarkRead: (ids: string[]) => void;
};

/** Mark visible unread on open; mark the rest when the last unread scrolls into view. */
export function useNotificationReadOnView({
  active,
  items,
  scrollRef,
  itemRefs,
  onMarkRead,
}: Options) {
  const markedRef = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!active) {
      markedRef.current.clear();
      observerRef.current?.disconnect();
      observerRef.current = null;
      return;
    }

    const container = scrollRef.current;
    if (!container) return;

    const unreadItems = items.filter((n) => !n.read_at);
    if (unreadItems.length === 0) return;

    function markIds(ids: string[]) {
      const fresh = ids.filter(
        (id) => !markedRef.current.has(id) && unreadItems.some((n) => n.id === id && !n.read_at)
      );
      if (fresh.length === 0) return;
      for (const id of fresh) markedRef.current.add(id);
      onMarkRead(fresh);
    }

    const frame = requestAnimationFrame(() => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;

      const visibleIds: string[] = [];
      for (const n of unreadItems) {
        const el = itemRefs.current?.get(n.id);
        if (el && isVisibleInScrollContainer(el, scrollEl)) {
          visibleIds.push(n.id);
        }
      }
      markIds(visibleIds);

      const remaining = unreadItems.filter((n) => !markedRef.current.has(n.id));
      if (remaining.length === 0) return;

      const lastUnread = remaining[remaining.length - 1];
      const lastEl = itemRefs.current?.get(lastUnread.id);
      if (!lastEl) return;

      observerRef.current?.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          const ids = unreadItems
            .filter((n) => !markedRef.current.has(n.id))
            .map((n) => n.id);
          markIds(ids);
          observerRef.current?.disconnect();
        },
        { root: scrollEl, threshold: 0.35 }
      );
      observerRef.current.observe(lastEl);
    });

    return () => {
      cancelAnimationFrame(frame);
      observerRef.current?.disconnect();
    };
  }, [active, items, scrollRef, itemRefs, onMarkRead]);
}
