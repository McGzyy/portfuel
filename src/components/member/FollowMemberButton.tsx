"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function FollowMemberButton({
  memberId,
  memberUsername,
  initialFollowing,
}: {
  memberId: string;
  memberUsername: string;
  initialFollowing: boolean;
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
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        className={cn(
          "rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
          following
            ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            : "bg-[var(--pf-red)] text-white hover:bg-red-600"
        )}
      >
        {busy ? "…" : following ? "Following" : `Follow @${memberUsername}`}
      </button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
