"use client";

import { Suspense } from "react";
import { BillingSessionSync } from "@/components/billing/BillingSessionSync";

export function SettingsBillingSync() {
  return (
    <Suspense fallback={null}>
      <BillingSessionSync />
    </Suspense>
  );
}
