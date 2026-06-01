"use client";

import { useCallback, useEffect, useState } from "react";

type LinkStatus =
  | { loading: true }
  | { loading: false; linked: false }
  | {
      loading: false;
      linked: true;
      membershipTier: string | null;
      isActive: boolean;
      isPro: boolean;
    };

const GUILD_ID = "1508150607285063850";
const VERIFICATION_CHANNEL_ID = "1510828920487022652";

export function ProfileDiscordSection() {
  const [status, setStatus] = useState<LinkStatus>({ loading: true });

  const load = useCallback(async () => {
    setStatus({ loading: true });
    try {
      const res = await fetch("/api/discord/link/status");
      const data = await res.json();
      if (!res.ok || !data.linked) {
        setStatus({ loading: false, linked: false });
        return;
      }
      setStatus({
        loading: false,
        linked: true,
        membershipTier: data.membershipTier ?? null,
        isActive: Boolean(data.isActive),
        isPro: Boolean(data.isPro),
      });
    } catch {
      setStatus({ loading: false, linked: false });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const discordChannelUrl = `https://discord.com/channels/${GUILD_ID}/${VERIFICATION_CHANNEL_ID}`;

  return (
    <section className="pf-workspace-panel p-6">
      <h2 className="text-lg font-semibold tracking-tight">Discord</h2>
      <p className="mt-2 text-sm text-[var(--pf-gray-600)]">
        Connect your Discord account to unlock member and Pro channels in the PortFuel server.
      </p>

      {status.loading ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">Checking link status…</p>
      ) : status.linked ? (
        <div className="mt-4 space-y-3 text-sm">
          <p className="font-medium text-emerald-700">Discord linked</p>
          <p className="text-[var(--pf-gray-600)]">
            Tier:{" "}
            {status.isPro ? "Pro Member" : status.isActive ? "PortFuel Member" : "Verified only (no active subscription)"}
          </p>
          <p className="text-xs text-[var(--pf-gray-500)]">
            Roles sync automatically when your subscription changes.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="rounded-md border border-[var(--pf-gray-200)] px-3 py-2 text-xs font-semibold hover:bg-[var(--pf-gray-50)]"
              onClick={async () => {
                await fetch("/api/discord/link/refresh", { method: "POST" });
                window.alert("Discord role sync queued. Give it up to a minute.");
              }}
            >
              Refresh Discord roles
            </button>
            <button
              type="button"
              className="rounded-md border border-[var(--pf-gray-200)] px-3 py-2 text-xs font-semibold text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-50)]"
              onClick={async () => {
                if (!window.confirm("Unlink Discord from PortFuel? Member roles will be removed on next sync.")) return;
                const res = await fetch("/api/discord/link/unlink", { method: "POST" });
                if (res.ok) void load();
                else window.alert("Could not unlink. Try again.");
              }}
            >
              Unlink Discord
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-[var(--pf-gray-600)]">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Join the PortFuel Discord and go to <strong>#verification</strong>.
            </li>
            <li>
              Click <strong>Verify</strong> to unlock basic channels.
            </li>
            <li>
              Click <strong>Link PortFuel</strong> in that channel — it will open a link while
              you&apos;re logged into this dashboard.
            </li>
          </ol>
          <a
            href={discordChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-[var(--pf-red)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[color-mix(in_oklab,var(--pf-red),black_10%)]"
          >
            Open #verification in Discord
          </a>
        </div>
      )}
    </section>
  );
}
