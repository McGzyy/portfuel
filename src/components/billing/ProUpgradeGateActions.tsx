"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProUpgradeProrationHint } from "@/components/billing/ProUpgradeProrationHint";
import { formatProUpgradeCta } from "@/lib/marketing/plans";

const BILLING_HREF = "/dashboard/settings?section=billing";

export function ProUpgradeGateActions() {
  return (
    <>
      <Link href={BILLING_HREF} className="mt-4 inline-block">
        <Button size="sm">{formatProUpgradeCta()}</Button>
      </Link>
      <ProUpgradeProrationHint className="mt-2 max-w-xs text-center" />
    </>
  );
}
