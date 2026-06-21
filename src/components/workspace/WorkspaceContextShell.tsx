import { cn } from "@/lib/utils";

export function WorkspaceContextShell({
  children,
  rail,
  mainClassName,
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
  mainClassName?: string;
}) {
  if (!rail) {
    return <div className={mainClassName}>{children}</div>;
  }

  return (
    <div className="pf-workspace-context-shell">
      <div className={cn("pf-workspace-context-main min-w-0", mainClassName)}>{children}</div>
      {rail}
    </div>
  );
}
