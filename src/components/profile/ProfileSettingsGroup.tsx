import { cn } from "@/lib/utils";

export function ProfileSettingsGroup({
  id,
  title,
  description,
  defaultOpen = false,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details
      id={id}
      className={cn("pf-profile-settings group", className)}
      open={defaultOpen || undefined}
    >
      <summary className="pf-profile-settings-summary cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--pf-black)]">{title}</p>
            {description ? (
              <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{description}</p>
            ) : null}
          </div>
          <span className="shrink-0 text-xs font-semibold text-[var(--pf-gray-500)] group-open:hidden">
            Expand
          </span>
          <span className="hidden shrink-0 text-xs font-semibold text-[var(--pf-gray-500)] group-open:inline">
            Collapse
          </span>
        </div>
      </summary>
      <div className="pf-profile-settings-body space-y-4">{children}</div>
    </details>
  );
}
