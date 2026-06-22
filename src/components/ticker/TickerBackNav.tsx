"use client";

import Link from "next/link";
import { useInWorkspaceShell } from "@/components/dashboard/WorkspaceShellContext";

export function TickerBackNav({ loggedIn }: { loggedIn: boolean }) {
  const inShell = useInWorkspaceShell();
  if (inShell) return null;

  return loggedIn ? (
    <Link
      href="/dashboard"
      className="inline-flex text-sm font-medium text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-red)]"
    >
      ← Workspace
    </Link>
  ) : (
    <Link
      href="/"
      className="inline-flex text-sm font-medium text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-red)]"
    >
      ← Home
    </Link>
  );
}
