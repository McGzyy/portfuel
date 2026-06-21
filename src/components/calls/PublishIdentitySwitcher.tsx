"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export function PublishIdentitySwitcher({
  className,
  compact = false,
}: {
  className?: string;
  /** Header-friendly single-line control — keeps the sidebar shorter. */
  compact?: boolean;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

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
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-left text-sm",
          compact
            ? "h-8 max-w-[11rem] px-2.5 text-xs"
            : "w-full px-3 py-2.5"
        )}
      >
        <span className="min-w-0">
          {compact ? (
            <span className="block truncate font-semibold text-[var(--pf-black)]">
              {active?.label ?? "—"}
            </span>
          ) : (
            <>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Publishing as
              </span>
              <span className="font-semibold text-[var(--pf-black)]">
                {active?.label ?? "—"}
              </span>
              {active ? (
                <span
                  className={cn(
                    "mt-0.5 inline-block rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wide",
                    active.kind === "desk"
                      ? "bg-[var(--pf-red)]/10 text-[var(--pf-red)]"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {active.kind === "desk" ? "Fueled desk" : "Personal"}
                </span>
              ) : null}
            </>
          )}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--pf-gray-400)]" aria-hidden />
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
