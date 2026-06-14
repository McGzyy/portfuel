import Link from "next/link";
import {
  Download,
  FileText,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";

const PERKS = [
  {
    href: buildResearchHubHref("screener"),
    icon: ScanSearch,
    title: "Community screener",
    detail: "Target progress, conviction filters, and CSV export.",
  },
  {
    href: "/dashboard/watchlist",
    icon: Sparkles,
    title: "Watchlist AI digest",
    detail: "Weekly synthesis of your symbols — run it from the watchlist page.",
  },
  {
    href: "/dashboard/journal",
    icon: Download,
    title: "Journal export",
    detail: "Download your private research as markdown from any journal hub.",
  },
  {
    href: "/dashboard/help",
    icon: FileText,
    title: "Help AI assistant",
    detail: "Ask product and workflow questions with Pro quota on Help & support.",
  },
] as const;

/** Surfaces Pro-only tools members may not discover from the tier table alone. */
export function ProPerksQuickLinks({ className }: { className?: string }) {
  return (
    <section
      className={`pf-workspace-panel overflow-hidden p-4 sm:p-5 ${className ?? ""}`}
      aria-label="Pro perks"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Pro perks · quick links
      </p>
      <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
        Tools included with Pro Intelligence — easy to miss if you only use the overview terminal.
      </p>
      <ul className="mt-4 divide-y divide-[var(--pf-border)]">
        {PERKS.map(({ href, icon: Icon, title, detail }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:text-[var(--pf-red)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[var(--pf-black)]">{title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[var(--pf-gray-600)]">
                  {detail}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
