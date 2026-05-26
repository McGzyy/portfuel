import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesWorkspace } from "@/components/messages/MessagesWorkspace";

export const metadata: Metadata = {
  title: "Messages",
};

export default function DashboardMessagesPage() {
  return (
    <Suspense
      fallback={
        <p className="mt-8 text-sm text-[var(--pf-gray-500)]">Loading messages…</p>
      }
    >
      <MessagesWorkspace />
    </Suspense>
  );
}
