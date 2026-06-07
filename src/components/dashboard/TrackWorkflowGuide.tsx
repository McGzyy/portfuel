import Link from "next/link";
import { BookOpen, Megaphone, PenLine, Plus, Search } from "lucide-react";
import { COPY } from "@/lib/copy";

const STEPS = [
  {
    n: 1,
    title: "Add to watchlist",
    desc: "Type a symbol in Your symbols — we open your private journal.",
    icon: Plus,
  },
  {
    n: 2,
    title: "Draft thesis & plan",
    desc: "Entry, target, stop, catalysts — saved privately. Edits are logged.",
    icon: BookOpen,
  },
  {
    n: 3,
    title: "Log journal entries",
    desc: "Price action, earnings, thesis updates over time.",
    icon: PenLine,
  },
  {
    n: 4,
    title: "Publish a call",
    desc: "When your checklist is complete — community sees the call, not your notes.",
    icon: Megaphone,
  },
] as const;

export function TrackWorkflowGuide() {
  return (
    <section
      className="pf-workspace-panel overflow-hidden p-4 sm:p-5"
      aria-label="How watchlist and journal work"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            How it works
          </p>
          <p className="mt-1 max-w-xl text-sm text-[var(--pf-gray-600)]">
            Your watchlist is your research queue. Adding a symbol is not the same as looking one
            up — lookup is browse-only.
          </p>
        </div>
        <Link
          href="/dashboard/journal"
          className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Open journal hub →
        </Link>
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.n}
              className="flex gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-3 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                {step.n}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--pf-black)]">
                  <Icon className="h-3.5 w-3.5 text-indigo-600" strokeWidth={2.25} aria-hidden />
                  {step.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--pf-gray-500)]">
                  {step.desc}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex gap-3 rounded-lg border border-dashed border-[var(--pf-border)] bg-white px-3 py-3">
        <Search className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" aria-hidden />
        <div className="min-w-0 text-xs text-[var(--pf-gray-600)]">
          <span className="font-semibold text-[var(--pf-black)]">Symbol lookup</span> opens chart
          and community intel for any ticker — it does{" "}
          <span className="font-semibold">not</span> add to your watchlist. To track a name, use{" "}
          <span className="font-semibold">Your symbols</span> below or {COPY.journalAddSymbol} on
          the watchlist panel.
        </div>
      </div>
    </section>
  );
}
