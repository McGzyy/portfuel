import { Suspense } from "react";

function NewCallFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pf-gray-50)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
    </div>
  );
}

export default function NewCallLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<NewCallFallback />}>{children}</Suspense>;
}
