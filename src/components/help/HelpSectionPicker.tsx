"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LifeBuoy } from "lucide-react";
import {
  HELP_SECTIONS,
  helpSectionHref,
  type HelpSectionId,
} from "@/lib/help/content";

type PickerValue = HelpSectionId | "tickets";

function pickerHref(value: PickerValue, sectionFallback: HelpSectionId): string {
  if (value === "tickets") return helpSectionHref(sectionFallback, "tickets");
  return helpSectionHref(value);
}

export function HelpSectionPicker({
  active,
  ticketsView,
  awaitingReplyCount = 0,
}: {
  active: HelpSectionId;
  ticketsView: boolean;
  awaitingReplyCount?: number;
}) {
  const router = useRouter();
  const value: PickerValue = ticketsView ? "tickets" : active;

  const activeMeta = ticketsView
    ? { label: "Support tickets", description: "Open a case or track replies" }
    : HELP_SECTIONS.find((s) => s.id === active);

  return (
    <div className="space-y-3 lg:hidden">
      <div>
        <label
          htmlFor="help-section-picker"
          className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]"
        >
          Topic
        </label>
        <div className="relative">
          <select
            id="help-section-picker"
            value={value}
            onChange={(e) => {
              router.push(pickerHref(e.target.value as PickerValue, active));
            }}
            className="w-full appearance-none rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] py-2.5 pl-3 pr-10 text-sm font-semibold text-[var(--foreground)] shadow-[var(--pf-shadow-sm)] outline-none transition-colors focus:border-[var(--pf-gray-300)]"
          >
            {HELP_SECTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="tickets">
              Support tickets
              {awaitingReplyCount > 0 ? ` (${awaitingReplyCount} reply needed)` : ""}
            </option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pf-gray-400)]"
            aria-hidden
          />
        </div>
      </div>

      {activeMeta ? (
        <div className="flex items-start gap-2 px-0.5">
          <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[var(--foreground)]">{activeMeta.label}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--pf-gray-500)]">
              {activeMeta.description}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
