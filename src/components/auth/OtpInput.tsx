"use client";

import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  className,
}: {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  const focusAt = (index: number) => {
    refs.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  };

  const setValue = useCallback(
    (next: string) => onChange(next.replace(/\D/g, "").slice(0, length)),
    [length, onChange]
  );

  const handleKey = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = value.split("");
      if (arr[index]) {
        arr[index] = "";
        setValue(arr.join(""));
      } else if (index > 0) {
        arr[index - 1] = "";
        setValue(arr.join(""));
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handleInput = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const arr = Array.from({ length }, (_, i) => value[i] ?? "");
    arr[index] = digit;
    setValue(arr.join(""));
    if (index < length - 1) focusAt(index + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) setValue(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      className={cn("flex justify-center gap-2", className)}
      role="group"
      aria-label="Authenticator code"
    >
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={c}
          className="pf-otp-box"
          onKeyDown={(e) => handleKey(i, e)}
          onChange={(e) => handleInput(i, e.target.value)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
