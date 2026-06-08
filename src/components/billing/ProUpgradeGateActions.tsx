"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProUpgradeProrationHint } from "@/components/billing/ProUpgradeProrationHint";
import { formatProUpgradeCta } from "@/lib/marketing/plans";
import { PRO_BILLING_HREF } from "@/lib/billing/upgrade-href";

export function ProUpgradeGateActions() {
  return (
    <>
      <Link href={PRO_BILLING_HREF} className="mt-4 inline-block">
        <Button size="sm">{formatProUpgradeCta()}</Button>
      </Link>
      <ProUpgradeProrationHint className="mt-2 max-w-xs text-center" />
    </>
  );
}
