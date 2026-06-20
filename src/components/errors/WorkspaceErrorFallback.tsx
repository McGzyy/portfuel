"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkspaceErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  description = "This page hit an unexpected error. Your account and data are safe \u2014 try reloading the section or head back to overview.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error("[workspace-error]", error);
  }, [error]);

  return (
    <div className="pf-workspace-content flex min-h-[min(24rem,60vh)] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-surface)] px-6 py-8 text-center shadow-[var(--pf-shadow-sm)]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
          <AlertTriangle className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <h1 className="mt-4 text-lg font-bold tracking-tight text-[var(--pf-black)]">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)]">{description}</p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[10px] text-[var(--pf-gray-400)]">Ref: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.25} />
            Try again
          </Button>
          <Link href="/dashboard">
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" strokeWidth={2.25} />
              Overview
            </Button>
          </Link>
        </div>
        <Link
          href="/dashboard/help?view=tickets&new=1"
          className="mt-4 inline-block text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)] hover:underline"
        >
          Report this issue
        </Link>
      </div>
    </div>
  );
}
