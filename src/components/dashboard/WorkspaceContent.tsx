"use client";

import { usePathname } from "next/navigation";
import { PullToRefresh } from "@/components/layout/PullToRefresh";
import { cn } from "@/lib/utils";

export function WorkspaceContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFeed =
    pathname === "/dashboard/feed" || pathname.startsWith("/dashboard/feed/");

  return (
    <PullToRefresh>
      <div
        className={cn(
          "pf-workspace-content",
          isFeed && "pf-workspace-content--feed"
        )}
      >
        {children}
      </div>
    </PullToRefresh>
  );
}
