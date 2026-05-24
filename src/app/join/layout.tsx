import { Suspense } from "react";

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--pf-gray-50)]" />}>{children}</Suspense>;
}
