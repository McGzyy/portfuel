import { Suspense } from "react";

export default function JoinSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--pf-gray-50)]" />}>
      {children}
    </Suspense>
  );
}
