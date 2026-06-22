"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

export function WorkspaceSidebarFooter({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("pf-sidebar-footer shrink-0", className)}>
      <Link
        href={COPY.newCallHref}
        onClick={onNavigate}
        className="pf-sidebar-footer-cta hidden lg:flex"
      >
        <Megaphone className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        {COPY.publishCallCta}
      </Link>
    </div>
  );
}
