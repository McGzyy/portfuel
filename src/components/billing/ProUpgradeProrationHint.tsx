"use client";

import { cn } from "@/lib/utils";
import { useUpgradeProrationHint } from "@/components/billing/use-upgrade-proration-hint";

export function ProUpgradeProrationHint({
  className,
  fallback = "Prorated when you upgrade from Member.",
}: {
  className?: string;
  fallback?: string;
}) {
  const hint = useUpgradeProrationHint(fallback);

  return <p className={cn("text-xs leading-relaxed text-[var(--pf-gray-500)]", className)}>{hint}</p>;
}
