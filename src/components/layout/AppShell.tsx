import { SiteHeader } from "@/components/brand/SiteHeader";
import { cn } from "@/lib/utils";
import type { HeaderUser } from "@/lib/auth/session-user";

export function AppShell({
  user,
  children,
  className,
  mainClassName,
  width = "default",
}: {
  user: HeaderUser;
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
  width?: "default" | "narrow";
}) {
  const maxW = width === "narrow" ? "max-w-2xl" : "max-w-6xl";

  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <SiteHeader user={user} />
      <div className="pf-app-bg flex-1">
        <main className={cn("mx-auto w-full px-4 py-8", maxW, mainClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}
