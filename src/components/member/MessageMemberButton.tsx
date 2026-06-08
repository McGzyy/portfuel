"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function MessageMemberButton({ username }: { username: string }) {
  return (
    <Link
      href={`/dashboard/messages?with=${encodeURIComponent(username)}`}
      className="pf-chip-action h-9 gap-1.5 px-3 text-sm font-medium text-[var(--pf-black)]"
    >
      <MessageCircle className="h-4 w-4" />
      Message
    </Link>
  );
}
