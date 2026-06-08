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
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 pr-1">
          <p className="text-sm font-semibold leading-snug text-[var(--pf-black)]">{label}</p>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-500)]">{description}</p>
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
            "relative mt-0.5 inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pf-red)]",
            checked ? "bg-[var(--pf-black)]" : "bg-[var(--pf-gray-200)]",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span
            className={cn(
              "pointer-events-none absolute top-0.5 left-0.5 block h-6 w-6 rounded-full bg-white shadow transition-transform",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
      {children ? <div className="mt-3 space-y-2">{children}</div> : null}
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
    <label className="flex flex-col gap-1.5 text-sm text-[var(--pf-gray-600)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      <span className="font-medium text-[var(--pf-gray-700)]">{label}</span>
      <select
        value={String(value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] px-2.5 py-2 text-sm font-medium text-[var(--pf-black)] sm:w-auto sm:py-1.5"
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
    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--pf-border)] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold pf-settings-save disabled:opacity-60 sm:w-auto sm:py-2"
      >
        {saving ? "Saving…" : saveLabel}
      </button>
      {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
      {error ? <span className="text-sm text-[var(--pf-red)]">{error}</span> : null}
    </div>
  );
}
