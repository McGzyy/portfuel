import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";

export function MessagesCommandHeader({
  threadCount,
  unreadThreads,
  activeName,
}: {
  threadCount: number;
  unreadThreads: number;
  activeName?: string | null;
}) {
  const status =
    activeName != null
      ? `Active: ${activeName}`
      : threadCount === 0
        ? "Start a chat from any member profile."
        : "Select a conversation to continue.";

  return (
    <WorkspacePageHeader
      eyebrow="Community · Messages"
      title="Direct messages"
      description={
        <>
          {threadCount} conversation{threadCount === 1 ? "" : "s"}
          {unreadThreads > 0 ? (
            <span className="font-semibold text-[var(--pf-red)]">
              {" "}
              · {unreadThreads} unread
            </span>
          ) : null}{" "}
          — {status} Not investment advice.
        </>
      }
      footerLink={
        <Link
          href="/dashboard/rankings"
          className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Find members to follow →
        </Link>
      }
    />
  );
}
