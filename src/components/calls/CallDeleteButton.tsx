"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CallDeleteButton({
  callId,
  symbol,
  className,
  onDeleted,
}: {
  callId: string;
  symbol: string;
  className?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `Remove this ${symbol} call from PortFuel? It will disappear from the feed, ticker pages, and the member's track record. This cannot be undone.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/calls/${callId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        window.alert(
          body.error === "forbidden"
            ? "Only admins can remove published calls."
            : "Could not delete this call. Try again."
        );
        return;
      }
      onDeleted?.();
      router.refresh();
    } catch {
      window.alert("Could not delete this call. Check your connection and try again.");
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
      onClick={() => void handleDelete()}
      className={cn(
        "h-8 gap-1.5 px-2 text-xs font-semibold text-[var(--pf-gray-500)] hover:text-rose-600",
        className
      )}
    >
      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
      {busy ? "Deleting…" : "Delete call"}
    </Button>
  );
}
