"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function JournalExportButton({
  symbol,
  proUnlocked,
  variant = "secondary",
  className,
}: {
  symbol?: string;
  proUnlocked: boolean;
  variant?: "secondary" | "outline";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!proUnlocked) {
    return (
      <Link
        href="/settings#billing"
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--pf-red)] hover:underline",
          className
        )}
      >
        Pro: export journal
      </Link>
    );
  }

  async function download() {
    setLoading(true);
    setError("");
    try {
      const q = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
      const res = await fetch(`/api/journal/export${q}`);
      if (!res.ok) {
        setError(
          res.status === 403 ? "Pro required" : "Could not export journal."
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = symbol
        ? `portfuel-journal-${symbol}.md`
        : "portfuel-journal-notebook.md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not export journal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <Button
        type="button"
        size="sm"
        variant={variant}
        disabled={loading}
        className="gap-1.5"
        onClick={() => void download()}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden />
        )}
        {symbol ? "Export symbol" : "Export notebook"}
      </Button>
      {error ? <span className="text-[10px] text-rose-600">{error}</span> : null}
    </div>
  );
}
