"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function MessageMemberButton({ username }: { username: string }) {
  return (
    <Link
      href={`/dashboard/messages?with=${encodeURIComponent(username)}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-white px-3 text-sm font-medium text-[var(--pf-black)] hover:bg-[var(--pf-gray-50)]"
    >
      <MessageCircle className="h-4 w-4" />
      Message
    </Link>
  );
}
