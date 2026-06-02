"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MODERATION_PRESETS } from "@/lib/member-lifecycle/moderation";
import type { ModerationPreset, UserLifecycleRow } from "@/lib/member-lifecycle/types";

type AuditRow = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

const PRESET_KEYS = Object.keys(MODERATION_PRESETS) as Exclude<ModerationPreset, "clear">[];

export function AdminMemberDetailPanel({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserLifecycleRow | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [moderationExpiresAt, setModerationExpiresAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members/${userId}`);
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load member.");
        return;
      }
      setUser(data.user);
      setAudit(data.audit ?? []);
      if (data.user?.moderation_expires_at) {
        setModerationExpiresAt(
          new Date(data.user.moderation_expires_at).toISOString().slice(0, 16)
        );
      }
    } catch {
      setError("Could not load member.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("Update failed.");
        return;
      }
      await load();
      router.refresh();
    } catch {
      setError("Update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  if (!user) {
    return <p className="mt-8 text-sm text-[var(--pf-red)]">{error || "Member not found."}</p>;
  }

  return (
    <div className="mt-8 space-y-6">
      <Link href="/admin?tab=members" className="text-sm font-medium text-[var(--pf-red)] hover:underline">
        ← Back to members
      </Link>

      {error ? (
        <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">{error}</p>
      ) : null}

      <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-6 shadow-[var(--pf-shadow-sm)]">
        <h2 className="text-lg font-semibold">
          @{user.username}
          {user.display_name ? ` · ${user.display_name}` : ""}
        </h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--pf-gray-500)]">Email</dt>
            <dd>{user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--pf-gray-500)]">Verified</dt>
            <dd>{user.email_verified_at ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-[var(--pf-gray-500)]">Stripe checkout email</dt>
            <dd>{user.stripe_checkout_email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--pf-gray-500)]">Status</dt>
            <dd>
              {user.subscription_status} · {user.membership_tier ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--pf-gray-500)]">Banned</dt>
            <dd>{user.banned_at ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-[var(--pf-gray-500)]">2FA</dt>
            <dd>{user.totp_verified ? "On" : "Off"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-6 shadow-[var(--pf-shadow-sm)]">
        <h3 className="font-semibold">Marketing lists</h3>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={user.marketing_member_opt_in}
              disabled={saving}
              onChange={(e) => patch({ marketingMemberOptIn: e.target.checked })}
            />
            Member updates
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={user.marketing_pro_opt_in}
              disabled={saving}
              onChange={(e) => patch({ marketingProOptIn: e.target.checked })}
            />
            Pro / desk updates
          </label>
        </div>
      </div>

      <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-6 shadow-[var(--pf-shadow-sm)]">
        <h3 className="font-semibold">Moderation</h3>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          Workspace: {user.can_access_workspace ? "open" : "locked"} · Calls:{" "}
          {user.can_publish_calls ? "yes" : "no"} · DMs: {user.can_dm ? "yes" : "no"} · Comments:{" "}
          {user.can_comment ? "yes" : "no"}
        </p>
        <label className="mt-4 block text-sm font-medium">Expires (optional)</label>
        <input
          type="datetime-local"
          className="mt-1 w-full max-w-xs rounded-md border border-[var(--pf-border)] px-3 py-2 text-sm"
          value={moderationExpiresAt}
          onChange={(e) => setModerationExpiresAt(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {PRESET_KEYS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() =>
                patch({
                  moderationPreset: preset,
                  moderationExpiresAt: moderationExpiresAt
                    ? new Date(moderationExpiresAt).toISOString()
                    : null,
                })
              }
            >
              {MODERATION_PRESETS[preset].label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => patch({ moderationPreset: "clear" })}
          >
            Clear restrictions
          </Button>
        </div>
        <div className="mt-4 flex gap-2">
          {user.banned_at ? (
            <Button type="button" size="sm" disabled={saving} onClick={() => patch({ banned: false })}>
              Unban
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[var(--pf-red)] text-[var(--pf-red)]"
              disabled={saving}
              onClick={() => patch({ banned: true })}
            >
              Ban (no login)
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-6 shadow-[var(--pf-shadow-sm)]">
        <h3 className="font-semibold">Audit log</h3>
        {audit.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--pf-gray-500)]">No admin actions logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {audit.map((row) => (
              <li key={row.id} className="border-b border-[var(--pf-border)] pb-2">
                <span className="font-medium">{row.action}</span>
                <span className="text-[var(--pf-gray-500)]">
                  {" "}
                  · {new Date(row.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
