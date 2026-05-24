"use client";

import { useCallback } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function PinPad({
  value,
  onChange,
  length = 5,
  disabled = false,
  className,
}: {
  value: string;
  onChange: (pin: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}) {
  const digits = value.padEnd(length, " ").split("").slice(0, length);
  const activeIndex = Math.min(value.length, length - 1);

  const append = useCallback(
    (d: string) => {
      if (disabled || value.length >= length) return;
      onChange(value + d);
    },
    [disabled, length, onChange, value]
  );

  const backspace = useCallback(() => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  }, [disabled, onChange, value]);

  const clear = useCallback(() => {
    if (disabled) return;
    onChange("");
  }, [disabled, onChange]);

  return (
    <div className={cn("select-none", className)}>
      <div className="pf-pin-slots" aria-label={`PortFuel ID, ${value.length} of ${length} digits`}>
        {digits.map((d, i) => (
          <div
            key={i}
            className={cn(
              "pf-pin-slot",
              d.trim() !== "" && "pf-pin-slot--filled",
              i === activeIndex && value.length < length && "pf-pin-slot--active"
            )}
            aria-hidden
          >
            {d.trim() !== "" ? d : ""}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled || value.length >= length}
            className="pf-key"
            onClick={() => append(k)}
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          className="pf-key pf-key--action"
          onClick={clear}
          aria-label="Clear"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={disabled || value.length >= length}
          className="pf-key"
          onClick={() => append("0")}
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled || value.length === 0}
          className="pf-key pf-key--action"
          onClick={backspace}
          aria-label="Delete last digit"
        >
          <Delete className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
