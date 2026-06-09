import Link from "next/link";
import { Ticket } from "lucide-react";
import {
  HELP_SECTIONS,
  helpSectionHref,
  type HelpSectionId,
} from "@/lib/help/content";
import { cn } from "@/lib/utils";

export function HelpNav({
  active,
  ticketsView,
}: {
  active: HelpSectionId;
  ticketsView: boolean;
}) {
  return (
    <nav className="flex flex-col gap-1 lg:sticky lg:top-4" aria-label="Help topics">
      {HELP_SECTIONS.map((item) => {
        const isActive = !ticketsView && item.id === active;
        return (
          <Link
            key={item.id}
            href={helpSectionHref(item.id)}
            className={cn(
              "rounded-lg border px-3 py-2.5 transition-colors",
              isActive
                ? "pf-pill-active"
                : "pf-pill-inactive hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]"
            )}
          >
            <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">
              {item.command}
            </span>
            <span className="mt-0.5 block text-sm font-semibold">{item.label}</span>
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
      <Link
        href={helpSectionHref(active, "tickets")}
        className={cn(
          "mt-2 rounded-lg border px-3 py-2.5 transition-colors",
          ticketsView
            ? "pf-pill-active"
            : "border-[var(--pf-border)] bg-[var(--pf-gray-50)]/80 hover:border-[var(--pf-gray-300)]"
        )}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Ticket className="h-4 w-4 shrink-0" />
          Support tickets
        </span>
        <span
          className={cn(
            "mt-0.5 block text-xs",
            ticketsView ? "text-white/75" : "text-[var(--pf-gray-500)]"
          )}
        >
          Open a case or track replies
        </span>
      </Link>
    </nav>
  );
}
