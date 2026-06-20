"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useWorkspaceActivityOptional } from "@/components/workspace/WorkspaceActivityProvider";

const POLL_MS = 60_000;
const FALLBACK_POLL_MS = 120_000;

export function NotificationUnreadBadge({
  initial = 0,
  className,
}: {
  initial?: number;
  className?: string;
}) {
  const activity = useWorkspaceActivityOptional();
  const streamLive = activity?.streamStatus === "live";
  const [count, setCount] = useState(initial);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread");
      if (res.ok) {
        const data = (await res.json()) as { count?: number };
        setCount(data.count ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setCount(initial);
  }, [initial]);

  useEffect(() => {
    if (activity?.notifUnread != null) {
      setCount(activity.notifUnread);
    }
  }, [activity?.notifUnread]);

  useEffect(() => {
    void load();
    const onRefresh = () => void load();
    window.addEventListener("focus", onRefresh);
    window.addEventListener("portfuel:notifications-unread-changed", onRefresh);
    const intervalMs = streamLive ? FALLBACK_POLL_MS : POLL_MS;
    const id = setInterval(() => void load(), intervalMs);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("portfuel:notifications-unread-changed", onRefresh);
    };
  }, [load, streamLive]);

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--pf-red)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white",
        className
      )}
      aria-label={`${count} unread notification${count === 1 ? "" : "s"}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
