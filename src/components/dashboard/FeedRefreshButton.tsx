"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FeedRefreshButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch("/api/calls/refresh-quotes", { method: "POST" });
      if (res.ok) router.refresh();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => void refresh()}
      className={cn(iconOnly ? "h-9 w-9 shrink-0 px-0" : "w-full gap-1.5 sm:w-auto", className)}
      aria-label={iconOnly ? (busy ? "Updating prices" : "Update prices") : undefined}
    >
      <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} strokeWidth={2.25} />
      {iconOnly ? (
        <span className="sr-only">{busy ? "Updating…" : "Update prices"}</span>
      ) : (
        busy ? "Updating…" : "Update prices"
      )}
    </Button>
  );
}
