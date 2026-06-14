"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CallCancelPendingButton({
  callId,
  symbol,
  className,
}: {
  callId: string;
  symbol: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (busy) return;
    if (!confirm(`Cancel pending entry call on ${symbol}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/calls/${callId}/cancel-pending`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={busy}
      className={className}
      onClick={() => void cancel()}
    >
      {busy ? "Cancelling…" : "Cancel pending"}
    </Button>
  );
}
