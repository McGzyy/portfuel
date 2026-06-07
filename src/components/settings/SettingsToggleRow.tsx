"use client";

import { cn } from "@/lib/utils";

export function SettingsToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  children,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--pf-border)] py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--pf-black)]">{label}</p>
          {description ? (
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--pf-gray-500)]">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            "relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pf-red)]",
            checked ? "bg-[var(--pf-black)]" : "bg-[var(--pf-gray-200)]",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span
            className={cn(
              "pointer-events-none absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
      {children ? <div className="mt-3 pl-0">{children}</div> : null}
    </div>
  );
}

export function SettingsSelectRow({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-[var(--pf-gray-600)]">
      <span>{label}</span>
      <select
        value={String(value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--pf-border)] bg-white px-2.5 py-1.5 text-sm font-medium text-[var(--pf-black)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsPanelActions({
  onSave,
  saving,
  message,
  error,
  saveLabel = "Save changes",
}: {
  onSave: () => void;
  saving: boolean;
  message: string | null;
  error: string | null;
  saveLabel?: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--pf-border)] pt-4">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-[var(--pf-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : saveLabel}
      </button>
      {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
      {error ? <span className="text-sm text-[var(--pf-red)]">{error}</span> : null}
    </div>
  );
}
