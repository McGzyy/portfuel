import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";

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
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Community · Messages
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
          Direct messages
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
          {threadCount} conversation{threadCount === 1 ? "" : "s"}
          {unreadThreads > 0 ? (
            <span className="font-semibold text-[var(--pf-red)]">
              {" "}
              · {unreadThreads} unread
            </span>
          ) : null}
          {" "}
          — {status} Not investment advice.
        </p>
        <Link
          href="/dashboard/rankings"
          className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Find members to follow →
        </Link>
      </div>
      <WorkspaceNewCallAction />
      </div>
    </header>
  );
}
