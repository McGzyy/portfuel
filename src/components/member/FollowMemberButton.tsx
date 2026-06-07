"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function FollowMemberButton({
  memberId,
  memberUsername,
  initialFollowing,
  variant = "light",
  compact = false,
}: {
  memberId: string;
  memberUsername: string;
  initialFollowing: boolean;
  /** Light = white workspace panels; dark = hero bands with light text */
  variant?: "light" | "dark";
  /** Table / inline — shorter label without @handle */
  compact?: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (following) {
        const res = await fetch(`/api/follows?userId=${encodeURIComponent(memberId)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          setError("Could not unfollow.");
          return;
        }
        setFollowing(false);
      } else {
        const res = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: memberId }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          if (data.error === "follow_limit") {
            setError("Follow limit reached (50).");
          } else {
            setError("Could not follow.");
          }
          return;
        }
        setFollowing(true);
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", compact ? "items-center" : "items-end")}>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        className={cn(
          "rounded-lg font-semibold transition-colors disabled:opacity-60",
          compact ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm",
          following
            ? variant === "dark"
              ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
              : "border border-[var(--pf-border)] bg-[var(--pf-gray-100)] text-[var(--pf-gray-800)] hover:bg-[var(--pf-gray-200)]"
            : "bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]"
        )}
      >
        {busy ? "…" : following ? "Following" : compact ? "Follow" : `Follow @${memberUsername}`}
      </button>
      {error ? (
        <p className={cn("text-xs", variant === "dark" ? "text-red-300" : "text-rose-600")}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
