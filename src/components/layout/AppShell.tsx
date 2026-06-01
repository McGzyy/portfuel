import { SiteHeader } from "@/components/brand/SiteHeader";
import { cn } from "@/lib/utils";
import type { HeaderUser } from "@/lib/auth/session-user";

export function AppShell({
  user,
  children,
  className,
  mainClassName,
  width = "default",
  headerMode = "default",
}: {
  user: HeaderUser;
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
  width?: "default" | "narrow";
  headerMode?: "default" | "workspace";
}) {
  const maxW = width === "narrow" ? "max-w-2xl" : "max-w-6xl";

  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <SiteHeader user={user} headerMode={headerMode} />
      <div className={cn("flex-1", headerMode === "workspace" ? "pf-workspace-shell" : "pf-app-bg")}>
        <main
          className={cn(
            "mx-auto w-full px-4 py-6 pb-[calc(1.5rem+var(--pf-safe-bottom))] sm:py-8",
            maxW,
            mainClassName
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
