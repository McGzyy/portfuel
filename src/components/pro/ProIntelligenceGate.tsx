import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { cn } from "@/lib/utils";

export function ProIntelligenceGate({
  locked,
  cta = "join",
  title = "Pro Intelligence",
  description = "Advanced analytics, full market intel, and desk-level feed metrics — included with the Pro Intelligence plan.",
  children,
  className,
  compact,
}: {
  locked: boolean;
  cta?: ProGateCta;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  if (!locked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("pf-pro-gate relative", className)}>
      <div className="pf-pro-gate-content" aria-hidden>
        {children}
      </div>
      <div
        className={cn(
          "pf-pro-gate-overlay",
          compact && "pf-pro-gate-overlay-compact"
        )}
      >
        <div className="pf-pro-gate-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
            <Lock className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <p className="mt-3 text-sm font-bold text-[var(--pf-black)]">{title}</p>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[var(--pf-gray-500)]">
            {description}
          </p>
          <ProGateActions cta={cta} />
        </div>
      </div>
    </div>
  );
}

function ProGateActions({ cta }: { cta: ProGateCta }) {
  if (cta === "upgrade") {
    return (
      <>
        <Link href="/profile" className="mt-4 inline-block">
          <Button size="sm">Upgrade to Pro — $129/mo</Button>
        </Link>
        <p className="mt-2 text-center text-xs text-[var(--pf-gray-500)]">
          Prorated when you upgrade from Member.
        </p>
      </>
    );
  }

  if (cta === "checkout") {
    return (
      <>
        <Link href="/join?pending=1" className="mt-4 inline-block">
          <Button size="sm">Complete checkout</Button>
        </Link>
        <Link
          href="/login"
          className="mt-2 block text-center text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
        >
          {COPY.ctaSignIn}
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/join" className="mt-4 inline-block">
        <Button size="sm">{COPY.ctaGetAccess}</Button>
      </Link>
      <Link
        href="/login"
        className="mt-2 block text-center text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
      >
        Already a member? {COPY.ctaSignIn}
      </Link>
    </>
  );
}
