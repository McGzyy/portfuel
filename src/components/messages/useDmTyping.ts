"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DM_TYPING_HEARTBEAT_MS,
  DM_TYPING_POLL_MS,
} from "@/lib/messages/constants";

async function postTyping(threadId: string, typing: boolean) {
  await fetch(`/api/messages/${threadId}/typing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typing }),
  });
}

export function useDmTyping(threadId: string | null, draft: string) {
  const [otherTyping, setOtherTyping] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setTypingActive = useCallback(
    async (active: boolean) => {
      if (!threadId) return;
      try {
        await postTyping(threadId, active);
      } catch {
        /* ignore */
      }
    },
    [threadId]
  );

  useEffect(() => {
    if (!threadId) {
      setOtherTyping(false);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/messages/${threadId}/typing`);
        if (!res.ok) return;
        const data = (await res.json()) as { typing?: boolean };
        if (!cancelled) setOtherTyping(Boolean(data.typing));
      } catch {
        /* ignore */
      }
    };

    void poll();
    const pollId = setInterval(() => void poll(), DM_TYPING_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      setOtherTyping(false);
    };
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;

    const hasDraft = draft.trim().length > 0;

    if (!hasDraft) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      void setTypingActive(false);
      return;
    }

    const ping = () => void setTypingActive(true);
    const debounce = setTimeout(ping, 350);
    heartbeatRef.current = setInterval(ping, DM_TYPING_HEARTBEAT_MS);

    return () => {
      clearTimeout(debounce);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [threadId, draft, setTypingActive]);

  useEffect(() => {
    return () => {
      if (threadId) void setTypingActive(false);
    };
  }, [threadId, setTypingActive]);

  return { otherTyping };
}
