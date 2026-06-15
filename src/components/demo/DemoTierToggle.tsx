"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import type { DemoPreviewTier } from "@/lib/demo/tier";
import { cn } from "@/lib/utils";

export function DemoTierToggle({
  tier,
  className,
}: {
  tier: DemoPreviewTier;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(tier);

  async function select(next: DemoPreviewTier) {
    if (next === active || pending) return;
    setActive(next);
    try {
      await fetch("/api/demo/tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: next }),
      });
      startTransition(() => router.refresh());
    } catch {
      setActive(tier);
    }
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-white/15 bg-black/25 p-0.5",
        className
      )}
      role="group"
      aria-label="Preview membership tier"
    >
      <button
        type="button"
        disabled={pending}
        onClick={() => void select("member")}
        className={cn(
          "rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-colors sm:px-3",
          active === "member"
            ? "bg-white text-[var(--pf-black)] shadow-sm"
            : "text-slate-300 hover:text-white"
        )}
      >
        Member
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => void select("pro")}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-colors sm:px-3",
          active === "pro"
            ? "bg-sky-500 text-white shadow-sm"
            : "text-slate-300 hover:text-white"
        )}
      >
        <Sparkles className="h-3 w-3" strokeWidth={2.5} />
        Pro
      </button>
    </div>
  );
}
