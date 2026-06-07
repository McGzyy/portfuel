"use client";

import { useAppearance } from "@/components/appearance/AppearanceProvider";
import { cn } from "@/lib/utils";

export function AppearanceSegmented<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  value: T;
  options: { id: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-lg border px-3 py-3 text-left transition-colors",
              active
                ? "pf-pill-active rounded-lg border px-3 py-3 text-left"
                : "rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-3 text-left text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]"
            )}
          >
            <span className="block text-sm font-semibold">{opt.label}</span>
            {opt.hint ? (
              <span
                className={cn(
                  "mt-0.5 block text-xs leading-relaxed",
                  active ? "text-white/75" : "text-[var(--pf-gray-500)]"
                )}
              >
                {opt.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsAppearanceSection() {
  const { prefs, setThemeMode, setIconTheme, saving, resolvedIconVariant } = useAppearance();

  return (
    <section aria-label="Appearance" className="pf-workspace-panel p-4 sm:p-5">
      <div className="border-b border-[var(--pf-border)] pb-4">
        <h2 className="text-base font-bold text-[var(--foreground)]">Appearance</h2>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          Theme and home-screen icon preferences sync across devices.
        </p>
      </div>

      <div className="space-y-6 pt-4">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Theme</p>
          <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
            Marketing and sign-in pages stay light. Your workspace follows this setting.
          </p>
          <div className="mt-3">
            <AppearanceSegmented
              ariaLabel="Theme"
              value={prefs.themeMode}
              disabled={saving}
              onChange={setThemeMode}
              options={[
                { id: "light", label: "Light", hint: "Default PortFuel look" },
                { id: "dark", label: "Dark", hint: "Easier on the eyes at night" },
              ]}
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Home screen icon</p>
          <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
            Auto follows your theme unless you pick a fixed tile. Safari updates the icon when you
            add PortFuel to your home screen again.
          </p>
          <div className="mt-3">
            <AppearanceSegmented
              ariaLabel="Home screen icon"
              value={prefs.iconTheme}
              disabled={saving}
              onChange={setIconTheme}
              options={[
                { id: "auto", label: "Auto", hint: "Dark tile in dark mode, brand red in light" },
                { id: "dark", label: "Dark", hint: "Charcoal gradient tile" },
                { id: "red", label: "Brand red", hint: "PortFuel red tile" },
                { id: "light", label: "Light", hint: "White tile" },
              ]}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--pf-gray-400)]">
            Active tile: {resolvedIconVariant}
            {saving ? " · Saving…" : null}
          </p>
        </div>
      </div>
    </section>
  );
}
