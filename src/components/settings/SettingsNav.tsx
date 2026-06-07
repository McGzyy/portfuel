import Link from "next/link";
import { cn } from "@/lib/utils";

export type SettingsSection = "billing" | "notifications" | "sharing" | "integrations";

export const SETTINGS_SECTIONS: {
  id: SettingsSection;
  label: string;
  description: string;
}[] = [
  {
    id: "billing",
    label: "Plan & billing",
    description: "Membership, Stripe, vouchers",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email, alerts, SMS, push",
  },
  {
    id: "sharing",
    label: "Sharing & referrals",
    description: "Invite credits, X highlight",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Discord and connected apps",
  },
];

export function parseSettingsSection(raw: string | undefined): SettingsSection {
  if (raw === "notifications" || raw === "sharing" || raw === "integrations") {
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
                ? "border-[var(--pf-black)] bg-[var(--pf-black)] text-white"
                : "border-[var(--pf-border)] bg-white text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]"
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

/** Horizontal section picker on mobile */
export function SettingsNavMobile({ active }: { active: SettingsSection }) {
  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
      aria-label="Settings sections"
    >
      {SETTINGS_SECTIONS.map((item) => (
        <Link
          key={item.id}
          href={settingsSectionHref(item.id)}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
            item.id === active
              ? "border-[var(--pf-black)] bg-[var(--pf-black)] text-white"
              : "border-[var(--pf-border)] bg-white text-[var(--pf-gray-700)]"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
