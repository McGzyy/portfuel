"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";
import {
  twoFactorBannerDismissedKey,
  twoFactorPromptSkippedKey,
} from "@/lib/auth/two-factor-prompt";
import { cn } from "@/lib/utils";

export function TwoFactorRecommendationBanner({
  userId,
  totpVerified,
  isAdmin,
  className,
}: {
  userId: string;
  totpVerified: boolean;
  isAdmin: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (totpVerified || isAdmin) {
      setVisible(false);
      return;
    }
    const skippedPrompt = localStorage.getItem(twoFactorPromptSkippedKey(userId)) === "1";
    const bannerDismissed =
      localStorage.getItem(twoFactorBannerDismissedKey(userId)) === "1";
    setVisible(skippedPrompt && !bannerDismissed);
  }, [userId, totpVerified, isAdmin]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(twoFactorBannerDismissedKey(userId), "1");
    setVisible(false);
  }

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/80 bg-amber-50 px-4 py-3",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0 text-sm text-amber-950">
          <p className="font-semibold">2FA is not enabled</p>
          <p className="mt-0.5 text-amber-900/90">
            We strongly recommend securing your account before publishing calls or DMs.{" "}
            <Link href="/security/2fa" className="font-semibold underline hover:no-underline">
              Set up 2FA
            </Link>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/security/2fa"
          className="inline-flex h-8 items-center justify-center rounded-[var(--pf-radius)] border border-amber-300 bg-white px-3 text-xs font-semibold text-[var(--pf-black)] hover:bg-amber-50"
        >
          Enable 2FA
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1.5 text-amber-800/70 hover:bg-amber-100 hover:text-amber-950"
          aria-label="Dismiss 2FA reminder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
