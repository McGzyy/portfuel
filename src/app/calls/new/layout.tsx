import { Suspense } from "react";

export default function NewCallLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-white" />}>{children}</Suspense>;
}
