import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesWorkspace } from "@/components/messages/MessagesWorkspace";
import { requireDashboardSession } from "@/lib/dashboard/data";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function DashboardMessagesPage() {
  const session = await requireDashboardSession();
  const proUnlocked = canAccessProIntelligence(sessionToProContext(session));

  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--pf-gray-500)]">Loading messages…</p>
      }
    >
      <MessagesWorkspace proUnlocked={proUnlocked} />
    </Suspense>
  );
}
