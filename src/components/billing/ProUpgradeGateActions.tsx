"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatProUpgradeCta } from "@/lib/marketing/plans";
import { formatUpgradeProrationHint } from "@/lib/stripe/format-upgrade-preview";
import type { MemberToProUpgradePreview } from "@/lib/stripe/upgrade-preview";

const BILLING_HREF = "/dashboard/settings?section=billing";

export function ProUpgradeGateActions() {
  const [hint, setHint] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/upgrade-preview");
      const data = await res.json();
      if (!res.ok) return;
      setHint(formatUpgradeProrationHint(data as MemberToProUpgradePreview));
    } catch {
      // Keep generic fallback below.
    }
  }, []);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  return (
    <>
      <Link href={BILLING_HREF} className="mt-4 inline-block">
        <Button size="sm">{formatProUpgradeCta()}</Button>
      </Link>
      <p className="mt-2 max-w-xs text-center text-xs leading-relaxed text-[var(--pf-gray-500)]">
        {hint ?? "Prorated when you upgrade from Member."}
      </p>
    </>
  );
}
