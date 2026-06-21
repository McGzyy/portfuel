"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { COPY } from "@/lib/copy";

/** Sticky publish CTA on mobile overview — sits above bottom nav. */
export function OverviewPublishFab() {
  return (
    <Link
      href={COPY.newCallHref}
      className="fixed right-4 z-[54] inline-flex h-11 items-center gap-2 rounded-full bg-[var(--pf-red)] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(227,27,35,0.35)] transition-colors hover:bg-[var(--pf-red-hover)] lg:hidden"
      style={{ bottom: "calc(var(--pf-bottom-nav-height) + 0.625rem)" }}
    >
      <Megaphone className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      {COPY.publishCall}
    </Link>
  );
}
