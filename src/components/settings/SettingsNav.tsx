import Link from "next/link";
import { cn } from "@/lib/utils";

export type SettingsSection =
  | "profile"
  | "billing"
  | "security"
  | "notifications"
  | "sharing"
  | "integrations"
  | "appearance";

export const SETTINGS_SECTIONS: {
  id: SettingsSection;
  label: string;
  mobileLabel: string;
  description: string;
}[] = [
  {
    id: "profile",
    label: "Profile",
    mobileLabel: "Profile",
    description: "Photo, name, bio",
  },
  {
    id: "billing",
    label: "Plan & billing",
    mobileLabel: "Billing",
    description: "Membership, Stripe, vouchers",
  },
  {
    id: "security",
    label: "Security",
    mobileLabel: "Security",
    description: "Sessions, 2FA, sign out",
  },
  {
    id: "notifications",
    label: "Notifications",
    mobileLabel: "Alerts",
    description: "Email, alerts, SMS, push",
  },
  {
    id: "sharing",
    label: "Sharing & referrals",
    mobileLabel: "Sharing",
    description: "Invite credits, X highlight",
  },
  {
    id: "integrations",
    label: "Integrations",
    mobileLabel: "Apps",
    description: "Discord and connected apps",
  },
  {
    id: "appearance",
    label: "Appearance",
    mobileLabel: "Theme",
    description: "Dark mode and home-screen icon",
  },
];

export function parseSettingsSection(raw: string | undefined): SettingsSection {
  if (
    raw === "profile" ||
    raw === "security" ||
    raw === "notifications" ||
    raw === "sharing" ||
    raw === "integrations" ||
    raw === "appearance"
  ) {
    return raw;
  }
  return "billing";
}

export function settingsSectionHref(section: SettingsSection): string {
  return section === "billing"
    ? "/dashboard/settings"
    : `/dashboard/settings?section=${section}`;
}

export function SettingsNav({ active }: { active: SettingsSection }) {
  return (
    <nav
      className="flex flex-col gap-1 lg:sticky lg:top-4"
      aria-label="Settings sections"
    >
      {SETTINGS_SECTIONS.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={settingsSectionHref(item.id)}
            className={cn(
              "rounded-lg border px-3 py-2.5 transition-colors",
              isActive
                ? "pf-pill-active rounded-lg border px-3 py-2.5"
                : "pf-pill-inactive rounded-lg border px-3 py-2.5 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]"
            )}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span
              className={cn(
                "mt-0.5 block text-xs",
                isActive ? "text-white/75" : "text-[var(--pf-gray-500)]"
              )}
            >
              {item.description}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Section picker — 2×2 grid on mobile, sticky while scrolling long panels */
export function SettingsNavMobile({ active }: { active: SettingsSection }) {
  const activeMeta = SETTINGS_SECTIONS.find((item) => item.id === active);

  return (
    <div className="pf-settings-mobile-nav lg:hidden">
      <nav
        className="pf-workspace-panel grid grid-cols-2 gap-2 p-2"
        aria-label="Settings sections"
      >
        {SETTINGS_SECTIONS.map((item) => {
          const isActive = item.id === active;
          return (
            <Link
              key={item.id}
              href={settingsSectionHref(item.id)}
              className={cn(
                "flex min-h-[4.25rem] flex-col justify-center rounded-lg border px-3 py-2.5 transition-colors",
                isActive
                  ? "pf-pill-active flex min-h-[4.25rem] flex-col justify-center rounded-lg border px-3 py-2.5 shadow-[var(--pf-shadow-sm)]"
                  : "flex min-h-[4.25rem] flex-col justify-center rounded-lg border border-transparent bg-[var(--pf-gray-50)] px-3 py-2.5 text-[var(--pf-gray-700)] active:bg-[var(--pf-gray-100)]"
              )}
            >
              <span className="text-sm font-semibold leading-tight">{item.mobileLabel}</span>
              <span
                className={cn(
                  "mt-1 line-clamp-2 text-[11px] leading-snug",
                  isActive ? "text-white/75" : "text-[var(--pf-gray-500)]"
                )}
              >
                {item.description}
              </span>
            </Link>
          );
        })}
      </nav>
      {activeMeta ? (
        <div className="mt-3 px-0.5">
          <h2 className="text-base font-bold text-[var(--foreground)]">{activeMeta.label}</h2>
          <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{activeMeta.description}</p>
        </div>
      ) : null}
    </div>
  );
}
