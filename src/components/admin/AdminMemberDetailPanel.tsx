"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MODERATION_PRESETS } from "@/lib/member-lifecycle/moderation";
import type { ModerationPreset, UserLifecycleRow } from "@/lib/member-lifecycle/types";
import { cn, timeAgo } from "@/lib/utils";

type AuditRow = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

type Activity = {
  callsCount: number;
  referralsCount: number;
};

const PRESET_KEYS = Object.keys(MODERATION_PRESETS) as Exclude<ModerationPreset, "clear">[];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]",
        className
      )}
    >
      <div className="border-b border-[var(--pf-border)] bg-gradient-to-b from-[var(--pf-gray-50)] to-white px-5 py-3.5">
        <h3 className="text-sm font-semibold text-[var(--pf-black)]">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{description}</p>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[var(--pf-gray-800)]">{value}</dd>
    </div>
  );
}

function FlagChip({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        allowed ? "bg-emerald-50 text-emerald-800" : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-500)]"
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", allowed ? "bg-emerald-500" : "bg-[var(--pf-gray-300)]")}
        aria-hidden
      />
      {label}
    </span>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "amber" | "gray" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "amber" && "bg-amber-50 text-amber-800",
        tone === "gray" && "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]",
        tone === "red" && "bg-[var(--pf-red-muted)] text-[var(--pf-red)]"
      )}
    >
      {children}
    </span>
  );
}

export function AdminMemberDetailPanel({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserLifecycleRow | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      setActivity(data.activity ?? null);
      setAudit(data.audit ?? []);
      setModerationExpiresAt(
        data.user?.moderation_expires_at
          ? new Date(data.user.moderation_expires_at).toISOString().slice(0, 16)
          : ""
      );
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

  async function deleteMember() {
    if (!user) return;
    const ok = window.confirm(
      `Delete @${user.username}? This permanently removes the member and all related data.`
    );
    if (!ok) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Delete failed.");
        return;
      }
      router.push("/admin?tab=members");
      router.refresh();
    } catch {
      setError("Delete failed.");
    } finally {
      setDeleting(false);
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

  const isActive = user.subscription_status === "active";
  const proGrantActive =
    Boolean(user.pro_granted_until) &&
    new Date(user.pro_granted_until!).getTime() > Date.now();

  return (
    <div className="mt-6 space-y-6">
      <Link
        href="/admin?tab=members"
        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--pf-red)] hover:underline"
      >
        ← All members
      </Link>

      {error ? (
        <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
          {error}
        </p>
      ) : null}

      {/* Hero */}
      <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
        <div className="h-1 bg-gradient-to-r from-[var(--pf-red)] via-[var(--pf-red-hover)] to-[var(--pf-navy)]" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">@{user.username}</h2>
              <StatusPill tone={isActive ? "green" : user.subscription_status === "pending" ? "amber" : "gray"}>
                {user.subscription_status}
              </StatusPill>
              {user.membership_tier ? (
                <StatusPill tone={user.membership_tier === "pro" ? "red" : "gray"}>
                  {user.membership_tier}
                </StatusPill>
              ) : null}
              {user.banned_at ? <StatusPill tone="red">Banned</StatusPill> : null}
            </div>
            {user.display_name ? (
              <p className="mt-1 text-sm text-[var(--pf-gray-600)]">{user.display_name}</p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--pf-gray-400)]">
              Joined {formatDate(user.created_at)} ·{" "}
              {(user as { last_active_at?: string | null }).last_active_at
                ? `Last active ${timeAgo((user as { last_active_at?: string | null }).last_active_at!)} · `
                : ""}
              {activity?.callsCount ?? user.calls_count} calls
              · {activity?.referralsCount ?? 0} referrals
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/member/${user.username}`}
              className="inline-flex h-9 items-center rounded-md border border-[var(--pf-border)] px-3 text-sm font-medium hover:bg-[var(--pf-gray-50)]"
            >
              Public profile
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-[var(--pf-red)] text-[var(--pf-red)] hover:bg-[var(--pf-red-muted)]"
          disabled={saving || deleting}
          onClick={deleteMember}
        >
          {deleting ? "Deleting…" : "Delete member"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Billing & access */}
        <Section
          title="Billing & access"
          description="Subscription tier, comp access, and submission quota."
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <InfoCell label="Stripe customer" value={user.stripe_customer_id ? "Linked" : "None"} />
            <InfoCell
              label="Pro grant"
              value={
                proGrantActive
                  ? `Until ${formatDate(user.pro_granted_until)}`
                  : user.pro_granted_until
                    ? "Expired"
                    : "None"
              }
            />
            <InfoCell label="Weekly call quota" value={`${user.submission_quota_week} / week`} />
            <InfoCell label="Trusted caller" value={user.trusted_at ? "Yes" : "No"} />
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {user.subscription_status !== "active" ? (
              <Button size="sm" disabled={saving} onClick={() => patch({ subscriptionStatus: "active" })}>
                Activate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => patch({ subscriptionStatus: "pending" })}
              >
                Deactivate
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => patch({ subscriptionStatus: "active", membershipTier: "pro" })}
            >
              Comp Pro
            </Button>
            {isActive && user.membership_tier !== "pro" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => patch({ membershipTier: "pro" })}
              >
                Set Pro
              </Button>
            ) : null}
            {isActive && user.membership_tier === "pro" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => patch({ membershipTier: "member" })}
              >
                Set Member
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              disabled={saving}
              onClick={() =>
                patch({
                  submissionQuotaWeek: user.submission_quota_week >= 5 ? 2 : 5,
                })
              }
            >
              Quota {user.submission_quota_week}/wk
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={saving}
              onClick={() => patch({ trusted: !user.trusted_at })}
            >
              {user.trusted_at ? "Remove trusted" : "Mark trusted"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-[var(--pf-gray-400)]">
            Comp Pro = active + Pro tier without Stripe. Use with{" "}
            <span className="font-mono">/join?invite=1</span> for friend demos.
          </p>
        </Section>

        {/* Account & email */}
        <Section title="Account & email" description="Login email and verification state.">
          <dl className="grid gap-4 sm:grid-cols-2">
            <InfoCell label="Account email" value={user.email ?? "—"} />
            <InfoCell
              label="Verified"
              value={
                user.email_verified_at ? (
                  <span className="text-emerald-700">Yes · {formatDate(user.email_verified_at)}</span>
                ) : (
                  <span className="text-amber-700">No</span>
                )
              }
            />
            <InfoCell label="Stripe checkout email" value={user.stripe_checkout_email ?? "—"} />
            <InfoCell label="Alert email" value={user.notify_email ?? "—"} />
            <InfoCell label="2FA" value={user.totp_verified ? "Enabled" : "Not set up"} />
            <InfoCell label="Billing interval" value={user.billing_interval ?? "—"} />
          </dl>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Moderation */}
        <Section title="Moderation" description="Temporary restrictions separate from billing.">
          <div className="flex flex-wrap gap-2">
            <FlagChip label="Workspace" allowed={user.can_access_workspace && !user.banned_at} />
            <FlagChip label="Calls" allowed={user.can_publish_calls && !user.banned_at} />
            <FlagChip label="DMs" allowed={user.can_dm && !user.banned_at} />
            <FlagChip label="Comments" allowed={user.can_comment && !user.banned_at} />
          </div>

          {user.moderation_expires_at ? (
            <p className="mt-3 text-xs text-[var(--pf-gray-500)]">
              Restrictions expire {formatDateTime(user.moderation_expires_at)}
            </p>
          ) : null}

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Expires (optional)
          </label>
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
              Clear all
            </Button>
          </div>

          <div className="mt-4 border-t border-[var(--pf-border)] pt-4">
            {user.banned_at ? (
              <Button type="button" size="sm" disabled={saving} onClick={() => patch({ banned: false })}>
                Unban account
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
                Ban — blocks login
              </Button>
            )}
          </div>
        </Section>

        {/* Marketing */}
        <Section title="Marketing opt-in" description="Separate lists for member and Pro campaigns.">
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--pf-border)] px-3 py-3 hover:bg-[var(--pf-gray-50)]">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={user.marketing_member_opt_in}
                disabled={saving}
                onChange={(e) => patch({ marketingMemberOptIn: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium">Member community updates</span>
                <span className="text-xs text-[var(--pf-gray-500)]">
                  Platform news, community events, general product updates.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--pf-border)] px-3 py-3 hover:bg-[var(--pf-gray-50)]">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={user.marketing_pro_opt_in}
                disabled={saving}
                onChange={(e) => patch({ marketingProOptIn: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium">Pro & desk announcements</span>
                <span className="text-xs text-[var(--pf-gray-500)]">
                  Fueled desk, intelligence features, Pro-tier campaigns.
                </span>
              </span>
            </label>
          </div>
        </Section>
      </div>

      {/* Audit log */}
      <Section title="Admin audit log" description="Recent actions on this member.">
        {audit.length === 0 ? (
          <p className="text-sm text-[var(--pf-gray-500)]">No admin actions logged yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--pf-border)]">
            {audit.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-[var(--pf-gray-800)]">
                  {row.action.replace(/_/g, " ")}
                </span>
                <time className="text-xs tabular-nums text-[var(--pf-gray-400)]">
                  {formatDateTime(row.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
