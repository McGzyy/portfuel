import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  title,
  subtitle,
  className,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className="pf-auth-bg flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-8" size="lg" />
      <div className={cn("pf-card-elevated w-full max-w-md overflow-hidden", className)}>
        <div className="h-1 bg-gradient-to-r from-[var(--pf-red)] via-[var(--pf-red-hover)] to-[var(--pf-black)]" />
        <div className="border-b border-[var(--pf-border)] bg-gradient-to-b from-white to-[var(--pf-gray-50)] px-6 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--pf-black)]">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--pf-gray-500)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
