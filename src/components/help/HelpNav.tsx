import Link from "next/link";
import { LifeBuoy, Ticket } from "lucide-react";
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

export function HelpNavMobile({
  active,
  ticketsView,
}: {
  active: HelpSectionId;
  ticketsView: boolean;
}) {
  const activeMeta = ticketsView
    ? { label: "Support tickets", description: "Open a case or track replies" }
    : HELP_SECTIONS.find((s) => s.id === active);

  return (
    <div className="pf-help-mobile-nav lg:hidden">
      <nav
        className="pf-workspace-panel flex gap-2 overflow-x-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Help topics"
      >
        {HELP_SECTIONS.map((item) => {
          const isActive = !ticketsView && item.id === active;
          return (
            <Link
              key={item.id}
              href={helpSectionHref(item.id)}
              className={cn(
                "flex min-w-[7.5rem] shrink-0 flex-col justify-center rounded-lg border px-3 py-2.5 transition-colors",
                isActive
                  ? "pf-pill-active shadow-[var(--pf-shadow-sm)]"
                  : "border-transparent bg-[var(--pf-gray-50)] text-[var(--pf-gray-700)] active:bg-[var(--pf-gray-100)]"
              )}
            >
              <span className="text-sm font-semibold leading-tight">{item.mobileLabel}</span>
            </Link>
          );
        })}
        <Link
          href={helpSectionHref(active, "tickets")}
          className={cn(
            "flex min-w-[7.5rem] shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors",
            ticketsView
              ? "pf-pill-active shadow-[var(--pf-shadow-sm)]"
              : "border-transparent bg-[var(--pf-gray-50)] text-[var(--pf-gray-700)]"
          )}
        >
          <Ticket className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold">Tickets</span>
        </Link>
      </nav>
      {activeMeta ? (
        <div className="mt-3 flex items-start gap-2 px-0.5">
          <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" />
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">{activeMeta.label}</h2>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{activeMeta.description}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
