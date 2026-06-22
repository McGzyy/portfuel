"use client";

import { usePathname } from "next/navigation";
import { PullToRefresh } from "@/components/layout/PullToRefresh";
import { ClientErrorBoundary } from "@/components/errors/ClientErrorBoundary";
import { cn } from "@/lib/utils";

export function WorkspaceContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFeed =
    pathname === "/dashboard/feed" || pathname.startsWith("/dashboard/feed/");
  const isWide =
    pathname === "/calls/new" || pathname.startsWith("/ticker/");
  const isOverview = pathname === "/dashboard";
  const isContextRail =
    pathname === "/dashboard" ||
    pathname === "/dashboard/book" ||
    pathname === "/dashboard/watchlist" ||
    pathname === "/dashboard/journal" ||
    pathname === "/dashboard/feed" ||
    pathname === "/dashboard/desk";

  return (
    <PullToRefresh>
      <div
        className={cn(
          "pf-workspace-content",
          isFeed && "pf-workspace-content--feed",
          isWide && "pf-workspace-content-wide",
          isOverview && "pf-workspace-content--overview",
          isContextRail && "pf-workspace-content--context-rail"
        )}
      >
        <ClientErrorBoundary>{children}</ClientErrorBoundary>
      </div>
    </PullToRefresh>
  );
}
