"use client";

import { Suspense } from "react";
import { BillingSessionSync } from "@/components/billing/BillingSessionSync";

export function ProfileBillingSync() {
  return (
    <Suspense fallback={null}>
      <BillingSessionSync />
    </Suspense>
  );
}
