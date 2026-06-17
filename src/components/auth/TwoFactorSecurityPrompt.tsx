"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  twoFactorBannerDismissedKey,
  twoFactorPromptSkippedKey,
} from "@/lib/auth/two-factor-prompt";
import { cn } from "@/lib/utils";

export function TwoFactorSecurityPrompt({
  userId,
  totpVerified,
  isAdmin,
}: {
  userId: string;
  totpVerified: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const skipKey = twoFactorPromptSkippedKey(userId);

  useEffect(() => {
    setHydrated(true);
    if (totpVerified || isAdmin) return;
    if (localStorage.getItem(skipKey) === "1") return;
    setOpen(true);
  }, [totpVerified, isAdmin, skipKey]);

  if (!hydrated || totpVerified || isAdmin || !open) return null;

  function continueWithout() {
    localStorage.setItem(skipKey, "1");
    localStorage.removeItem(twoFactorBannerDismissedKey(userId));
    setOpen(false);
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="two-factor-prompt-title"
    >
      <div
        className={cn(
          "relative w-full max-w-md rounded-[var(--pf-radius-xl)] border border-[var(--pf-border)]",
          "bg-[var(--pf-surface)] p-6 shadow-[var(--pf-shadow-xl)]"
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-md p-1.5 text-[var(--pf-gray-400)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-gray-700)]"
          aria-label="Close"
          onClick={continueWithout}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
          <ShieldCheck className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </div>

        <h2
          id="two-factor-prompt-title"
          className="mt-4 text-center text-xl font-bold tracking-tight text-[var(--pf-black)]"
        >
          Secure your account with 2FA
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Two-factor authentication is strongly recommended for PortFuel. It protects your calls,
          messages, and billing even if your password is compromised.
        </p>

        <ul className="mt-5 space-y-2 text-sm text-[var(--pf-gray-700)]">
          <li className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span>Takes about a minute with Google Authenticator, Authy, or 1Password.</span>
          </li>
          <li className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span>Required at sign-in only after you enable it — you can skip for now.</span>
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Button className="w-full" size="lg" onClick={() => router.push("/security/2fa")}>
            Set up 2FA now
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-[var(--pf-gray-600)]"
            onClick={continueWithout}
          >
            Continue to workspace
          </Button>
        </div>
      </div>
    </div>
  );
}
