"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
export function PublishSuccessBanner({ symbol }: { symbol: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("published") === "1") {
      setVisible(true);
      window.dispatchEvent(new Event("pf-checklist-update"));
      const params = new URLSearchParams(searchParams.toString());
      params.delete("published");
      const qs = params.toString();
      router.replace(qs ? `/ticker/${symbol}?${qs}` : `/ticker/${symbol}`, {
        scroll: false,
      });
    }
  }, [searchParams, router, symbol]);

  if (!visible) return null;

  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-[var(--pf-radius-lg)] border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 shadow-[var(--pf-shadow-sm)]"
      role="status"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.25} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-emerald-950">Call published on record</p>
        <p className="mt-0.5 text-xs leading-relaxed text-emerald-900/85">
          {symbol} is live on your profile and the member feed. Share it or add the symbol to your
          watchlist.
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/profile#calls" className="text-emerald-800 hover:underline">
            Your calls →
          </Link>
          <Link href="/dashboard/watchlist" className="text-emerald-800 hover:underline">
            Watchlist →
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-800/70 hover:bg-white/60"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
