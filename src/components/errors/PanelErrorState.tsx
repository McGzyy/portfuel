"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PanelErrorState({
  title = "Couldn\u2019t load this section",
  message = "Something went wrong fetching data. Your workspace is still available \u2014 try again in a moment.",
  onRetry,
  compact = false,
  className,
  helpHref = "/dashboard/help",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
  helpHref?: string;
}) {
  return (
    <div
      className={cn(
        "pf-workspace-panel border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20",
        compact ? "px-4 py-5" : "px-6 py-8",
        className
      )}
      role="alert"
    >
      <div className={cn("flex gap-3", compact ? "items-center" : "items-start")}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
            compact ? "h-9 w-9" : "h-10 w-10"
          )}
        >
          <AlertTriangle className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold text-[var(--pf-black)]", compact ? "text-sm" : "text-base")}>
            {title}
          </p>
          {!compact ? (
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--pf-gray-600)]">{message}</p>
          ) : (
            <p className="mt-0.5 text-xs text-[var(--pf-gray-600)]">{message}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onRetry ? (
              <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.25} />
                Try again
              </Button>
            ) : null}
            <Link
              href={helpHref}
              className="text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
            >
              Help center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
