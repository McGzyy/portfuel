"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Identity = {
  userId: string;
  username: string;
  displayName: string | null;
  kind: "desk" | "personal";
  label: string;
};

export function PublishIdentitySwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/switch-identity");
    if (!res.ok) return;
    const json = (await res.json()) as {
      activeUserId: string;
      identities: Identity[];
    };
    setActiveUserId(json.activeUserId);
    setIdentities(json.identities);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = identities.find((i) => i.userId === activeUserId);

  if (identities.length < 2) return null;

  async function switchTo(userId: string) {
    if (userId === activeUserId || busy) return;
    setBusy(true);
    setOpen(false);
    try {
      const res = await fetch("/api/admin/switch-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.refresh();
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 text-left text-sm"
      >
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Publishing as
          </span>
          <span className="font-semibold text-[var(--pf-black)]">
            {active?.label ?? "—"}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" aria-hidden />
      </button>
      {open ? (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] shadow-lg">
          {identities.map((identity) => (
            <li key={identity.userId}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--pf-gray-50)]",
                  identity.userId === activeUserId && "bg-[var(--pf-gray-50)] font-semibold"
                )}
                onClick={() => void switchTo(identity.userId)}
              >
                {identity.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
