import Link from "next/link";
import { Bell, LifeBuoy, UserRound } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";
import {
  SETTINGS_SECTIONS,
  settingsSectionHref,
  type SettingsSection,
} from "@/components/settings/SettingsNav";
import { cn } from "@/lib/utils";

function membershipLabel(tier: string | null | undefined): string {
  if (tier === "pro") return "Pro";
  if (tier === "founding") return "Founding";
  return "Standard";
}

export function SettingsContextRail({
  active,
  membershipTier,
  emailVerified,
  username,
}: {
  active: SettingsSection;
  membershipTier?: string | null;
  emailVerified?: boolean;
  username: string;
}) {
  return (
    <ContextRailModule eyebrow="Account" title="Settings pulse" ariaLabel="Settings context">
      <ContextRailBlock title="Plan">
        <div className="grid grid-cols-2 gap-2">
          <OverviewRailMiniStat label="Tier" value={membershipLabel(membershipTier)} />
          <OverviewRailMiniStat
            label="Email"
            value={emailVerified ? "Verified" : "Pending"}
            accent={emailVerified ? "positive" : undefined}
          />
        </div>
      </ContextRailBlock>

      <ContextRailBlock title="Sections">
        <div className="flex flex-col gap-1.5">
          {SETTINGS_SECTIONS.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={settingsSectionHref(item.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-2 transition-colors",
                  isActive
                    ? "border-[var(--pf-red)] bg-[var(--pf-red-muted)]"
                    : "border-[var(--pf-border)] bg-[var(--pf-gray-50)] hover:bg-white"
                )}
              >
                <span
                  className={cn(
                    "block text-[11px] font-semibold",
                    isActive ? "text-[var(--pf-red)]" : "text-[var(--pf-gray-800)]"
                  )}
                >
                  {item.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-[10px] leading-snug",
                    isActive ? "text-[var(--pf-red)]/80" : "text-[var(--pf-gray-500)]"
                  )}
                >
                  {item.description}
                </span>
              </Link>
            );
          })}
        </div>
      </ContextRailBlock>

      <ContextRailBlock title="Go">
        <div className="flex flex-col gap-1.5">
          <Link
            href={`/member/${username}`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <UserRound className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Public profile
          </Link>
          <Link
            href="/dashboard/notifications"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Bell className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Alerts inbox
          </Link>
          <Link
            href="/dashboard/help"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <LifeBuoy className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Help & support
          </Link>
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
