"use client";

import type { BillingInterval } from "@/lib/stripe/config";
import { cn } from "@/lib/utils";

export function BillingIntervalPicker({
  value,
  onChange,
  annualAvailable,
  className,
}: {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  annualAvailable: boolean;
  className?: string;
}) {
  if (!annualAvailable) return null;

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-1",
        className
      )}
      role="group"
      aria-label="Billing frequency"
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
          value === "monthly"
            ? "bg-white text-[var(--pf-black)] shadow-sm"
            : "text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
          value === "annual"
            ? "bg-white text-[var(--pf-black)] shadow-sm"
            : "text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
        )}
      >
        Annual
      </button>
    </div>
  );
}
