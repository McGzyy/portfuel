import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export function CallsEmptyState({
  icon: Icon = PenLine,
  title,
  description,
  showPublishCta = true,
  secondaryHref,
  secondaryLabel,
  onAction,
  actionLabel,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  showPublishCta?: boolean;
  secondaryHref?: string;
  secondaryLabel?: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="pf-workspace-panel px-6 py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[var(--pf-gray-500)]">
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <p className="mt-4 font-semibold text-[var(--pf-gray-800)]">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--pf-gray-500)]">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {showPublishCta ? (
          <Link href={COPY.newCallHref}>
            <Button>{COPY.publishCallCta}</Button>
          </Link>
        ) : null}
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref}>
            <Button variant="outline">{secondaryLabel}</Button>
          </Link>
        ) : null}
        {onAction && actionLabel ? (
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Alias for workspace panels outside the feed/book call lists. */
export const WorkspaceEmptyState = CallsEmptyState;
