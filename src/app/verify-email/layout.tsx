import { Suspense } from "react";

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="pf-auth-bg flex min-h-full flex-1 items-center justify-center px-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]"
            aria-label="Loading"
          />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
