"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CallCloseButton({
  callId,
  symbol,
  className,
  onClosed,
}: {
  callId: string;
  symbol: string;
  className?: string;
  onClosed?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClose() {
    const ok = window.confirm(
      `Close your ${symbol} call at the current market price? Return will be locked for your track record and rank score. You can still view it on your profile.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/calls/${callId}/close`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        returnPct?: number;
      };
      if (!res.ok) {
        const msg =
          body.error === "already_closed"
            ? "This call is already closed."
            : body.error === "fueled_desk"
              ? "Fueled desk calls cannot be closed this way."
              : body.error === "demo_readonly"
                ? "Demo calls are read-only."
                : "Could not close this call. Try again.";
        window.alert(msg);
        return;
      }
      onClosed?.();
      router.refresh();
    } catch {
      window.alert("Could not close this call. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={() => void handleClose()}
      className={cn(
        "h-8 gap-1.5 px-2 text-xs font-semibold text-[var(--pf-gray-500)] hover:text-emerald-700",
        className
      )}
    >
      <CircleCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
      {busy ? "Closing…" : "Close call"}
    </Button>
  );
}
