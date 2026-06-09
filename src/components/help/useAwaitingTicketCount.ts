"use client";

import { useEffect, useState } from "react";
import type { SupportTicketWithUser } from "@/lib/support/types";

export function useAwaitingTicketCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/support/tickets")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json: { tickets: SupportTicketWithUser[] }) => {
        if (!cancelled) {
          setCount(json.tickets.filter((t) => t.status === "waiting_on_member").length);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
