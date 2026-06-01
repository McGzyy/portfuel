"use client";

import { useCallback, useState } from "react";

export function DiscordLinkClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);

  const link = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/discord/link/consume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        window.location.href = "/dashboard?discordLinked=1";
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      const msg = data?.error ?? "link_failed";
      window.alert(`Discord link failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [token, loading]);

  return (
    <div className="mt-8">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md bg-[var(--pf-red)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color-mix(in_oklab,var(--pf-red),black_10%)] disabled:opacity-60"
        onClick={link}
        disabled={loading}
      >
        {loading ? "Linking…" : "Link my Discord"}
      </button>
      <p className="mt-3 text-xs text-[var(--pf-gray-500)]">
        If this fails, request a fresh link in Discord.
      </p>
    </div>
  );
}

