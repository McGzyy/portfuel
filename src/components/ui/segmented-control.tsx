"use client";

import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex w-full rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-1",
        className
      )}
      role="group"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all",
            value === opt.value
              ? "bg-white text-[var(--pf-black)] shadow-[var(--pf-shadow-sm)]"
              : "text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
