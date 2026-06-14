"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type IdentityBadge = {
  label: string;
  kind: "desk" | "personal";
};

/** Compact read-only badge when admin has desk + personal publish identities. */
export function PublishIdentityIndicator({ className }: { className?: string }) {
  const [badge, setBadge] = useState<IdentityBadge | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/switch-identity");
    if (!res.ok) return;
    const json = (await res.json()) as {
      activeUserId: string;
      identities: { userId: string; kind: "desk" | "personal"; label: string }[];
    };
    if (json.identities.length < 2) return;
    const active = json.identities.find((i) => i.userId === json.activeUserId);
    if (!active) return;
    setBadge({
      kind: active.kind,
      label: active.kind === "desk" ? "Desk · Fueled" : "Personal",
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!badge) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        badge.kind === "desk"
          ? "bg-[var(--pf-red)]/10 text-[var(--pf-red)]"
          : "bg-slate-100 text-slate-600",
        className
      )}
      title={`Publishing as ${badge.label}`}
    >
      {badge.label}
    </span>
  );
}
