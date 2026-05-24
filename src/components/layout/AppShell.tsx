import { SiteHeader } from "@/components/brand/SiteHeader";
import { cn } from "@/lib/utils";

export function AppShell({
  userPin,
  children,
  className,
  mainClassName,
  width = "default",
}: {
  userPin: string;
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
  width?: "default" | "narrow";
}) {
  const maxW = width === "narrow" ? "max-w-2xl" : "max-w-6xl";

  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <SiteHeader userPin={userPin} />
      <div className="flex-1 border-t border-transparent bg-gradient-to-b from-[var(--pf-gray-50)] to-white">
        <main className={cn("mx-auto w-full px-4 py-8", maxW, mainClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}
