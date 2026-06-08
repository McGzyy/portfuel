import Link from "next/link";
import { Bookmark, Megaphone, NotebookPen, PenLine } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

export type ResearchPipelineStep = "track" | "research" | "log" | "publish";

const STEPS: {
  id: ResearchPipelineStep;
  label: string;
  hint: string;
  href: string;
  icon: typeof Bookmark;
}[] = [
  {
    id: "track",
    label: "Track",
    hint: "Symbols & alerts",
    href: "/dashboard/watchlist",
    icon: Bookmark,
  },
  {
    id: "research",
    label: "Research",
    hint: "Thesis & plan",
    href: "/dashboard/journal",
    icon: NotebookPen,
  },
  {
    id: "log",
    label: "Log",
    hint: "Private entries",
    href: "/dashboard/journal",
    icon: PenLine,
  },
  {
    id: "publish",
    label: "Publish",
    hint: "Community call",
    href: COPY.newCallHref,
    icon: Megaphone,
  },
];

export function ResearchPipeline({
  current,
  logHref,
  publishHref,
  className,
}: {
  current: ResearchPipelineStep;
  /** Override log step when a specific symbol journal is open */
  logHref?: string;
  /** Override publish step when a journal is ready to publish */
  publishHref?: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "pf-workspace-panel grid gap-2 p-3 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-[var(--pf-border)] sm:p-0",
        className
      )}
      aria-label="Research workflow"
    >
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const active = step.id === current;
        const href =
          step.id === "log" && logHref
            ? logHref
            : step.id === "publish" && publishHref
              ? publishHref
              : step.href;
        const isPublish = step.id === "publish";

        return (
          <Link
            key={step.id}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors sm:px-4 sm:py-3.5",
              active
                ? "pf-pipeline-step-active mx-0.5 my-0.5 sm:mx-1 sm:my-1"
                : "hover:bg-[var(--pf-gray-50)]",
              isPublish && !active && "sm:border-l-0"
            )}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                active
                  ? "bg-[var(--pf-red)] text-white"
                  : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-500)]"
              )}
            >
              {active ? <Icon className="h-3.5 w-3.5" strokeWidth={2.25} /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-[var(--foreground)]">
                {step.label}
              </span>
              <span className="block truncate text-[10px] text-[var(--pf-gray-500)]">
                {step.hint}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
