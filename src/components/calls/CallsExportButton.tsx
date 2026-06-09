"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CallsExportButton({
  className,
  label = "Export CSV",
}: {
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/calls/export");
      if (!res.ok) {
        setError(res.status === 401 ? "Sign in to export." : "Could not export track record.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "portfuel-track-record.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not export track record.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("inline-flex flex-col items-stretch gap-1", className)}>
      <button
        type="button"
        onClick={() => void download()}
        disabled={loading}
        className="pf-chip-action h-9 gap-1.5 px-3 text-xs disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
        {loading ? "Exporting…" : label}
      </button>
      {error ? <p className="text-[10px] text-rose-600">{error}</p> : null}
    </div>
  );
}
