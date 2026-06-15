"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FeedRefreshButton({ className }: { className?: string }) {
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
      className={cn("w-full gap-1.5 sm:w-auto", className)}
    >
      <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} strokeWidth={2.25} />
      {busy ? "Updating…" : "Update prices"}
    </Button>
  );
}
