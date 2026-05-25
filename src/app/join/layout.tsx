import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Get member access",
  description: `Join ${SITE_NAME} — ${SITE_TAGLINE}. Member workspace, ticker intel, and Pro analytics.`,
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--pf-gray-50)]" />}>
      {children}
    </Suspense>
  );
}
