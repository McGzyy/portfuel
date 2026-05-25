"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function WorkspaceContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFeed =
    pathname === "/dashboard/feed" || pathname.startsWith("/dashboard/feed/");

  return (
    <div
      className={cn(
        "pf-workspace-content",
        isFeed && "pf-workspace-content--feed"
      )}
    >
      {children}
    </div>
  );
}
