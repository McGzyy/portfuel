"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { cn } from "@/lib/utils";

type Voucher = {
  id: string;
  code: string;
  label: string;
  kind: "checkout_discount" | "pro_trial";
  discount_type: "percent_off" | "amount_off" | null;
  discount_percent: number | null;
  discount_amount_cents: number | null;
  applicable_tier: string;
  applicable_interval: string;
  audience: string;
  max_redemptions: number | null;
  max_redemptions_per_user: number;
  expires_at: string | null;
  pro_trial_days: number | null;
  active: boolean;
  stripe_promotion_code_id: string | null;
  redemptionCount: number;
};

const KIND_LABEL: Record<Voucher["kind"], string> = {
  checkout_discount: "Checkout discount",
  pro_trial: "Pro upgrade trial",
};

export function AdminVouchersPanel() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [grantVoucherId, setGrantVoucherId] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);

  const [form, setForm] = useState({
    code: "",
    label: "",
    kind: "checkout_discount" as Voucher["kind"],
    discountType: "percent_off" as "percent_off" | "amount_off",
    discountPercent: "20",
    discountAmountCents: "1000",
    applicableTier: "any",
    applicableInterval: "any",
    audience: "public",
    maxRedemptions: "",
    maxPerUser: "1",
    expiresAt: "",
    proTrialDays: "14",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/vouchers");
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load vouchers.");
        return;
      }
      setVouchers(data.vouchers ?? []);
    } catch {
      setError("Could not load vouchers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = vouchers.filter((v) => v.active).length;
    const redemptions = vouchers.reduce((sum, v) => sum + v.redemptionCount, 0);
    const checkout = vouchers.filter((v) => v.kind === "checkout_discount").length;
    const trials = vouchers.filter((v) => v.kind === "pro_trial").length;
    return { total: vouchers.length, active, redemptions, checkout, trials };
  }, [vouchers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        code: form.code,
        label: form.label || form.code,
        kind: form.kind,
        applicableTier: form.applicableTier,
        applicableInterval: form.applicableInterval,
        audience: form.audience,
        maxRedemptionsPerUser: Number(form.maxPerUser) || 1,
        syncStripe: form.kind === "checkout_discount",
      };
      if (form.maxRedemptions.trim()) {
        body.maxRedemptions = Number(form.maxRedemptions);
      }
      if (form.expiresAt.trim()) {
        body.expiresAt = new Date(form.expiresAt).toISOString();
      }
      if (form.kind === "checkout_discount") {
        body.discountType = form.discountType;
        if (form.discountType === "percent_off") {
          body.discountPercent = Number(form.discountPercent);
        } else {
          body.discountAmountCents = Number(form.discountAmountCents);
        }
      } else {
        body.proTrialDays = Number(form.proTrialDays);
      }

      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "code_taken"
            ? "That code already exists."
            : "Create failed. Check fields and Stripe config."
        );
        return;
      }
      setForm((f) => ({ ...f, code: "", label: "" }));
      await load();
    } catch {
      setError("Create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(v: Voucher) {
    const res = await fetch(`/api/admin/vouchers/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !v.active }),
    });
    if (res.ok) await load();
  }

  async function submitGrant() {
    if (!grantVoucherId || !grantUserId) return;
    setGrantBusy(true);
    setError("");
    try {
      const v = vouchers.find((x) => x.id === grantVoucherId);
      const path =
        v?.audience === "affiliate"
          ? `/api/admin/vouchers/${grantVoucherId}/affiliate-grants`
          : `/api/admin/vouchers/${grantVoucherId}/assign`;
      const payload =
        v?.audience === "affiliate"
          ? { affiliateUserId: grantUserId }
          : { userId: grantUserId };

      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError("Grant failed — check voucher audience and user id.");
        return;
      }
      setGrantUserId("");
    } catch {
      setError("Grant failed.");
    } finally {
      setGrantBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {error ? (
        <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">{error}</p>
      ) : null}

      <section className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Growth · Vouchers
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--pf-black)]">
          Promo codes & Pro trials
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Checkout discounts sync to Stripe. Pro trials grant intelligence access without changing
          the subscription tier.
        </p>
        <MetricsStrip
          variant="embedded"
          className="mt-4 border-t border-[var(--pf-border)] pt-4 !px-0"
          eyebrow="Inventory"
          items={[
            { label: "Total", value: String(stats.total) },
            { label: "Active", value: String(stats.active), accent: "positive" },
            { label: "Redemptions", value: String(stats.redemptions) },
            { label: "Checkout", value: String(stats.checkout) },
            { label: "Pro trials", value: String(stats.trials) },
          ]}
        />
      </section>

      <form
        onSubmit={handleCreate}
        className="pf-workspace-panel space-y-4 p-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Create
        </p>
        <h2 className="text-lg font-bold text-[var(--pf-black)]">New voucher</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[var(--pf-gray-700)]">Code</span>
            <Input
              className="mt-1"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="LAUNCH20"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[var(--pf-gray-700)]">Label</span>
            <Input
              className="mt-1"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Launch promo"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[var(--pf-gray-700)]">Type</span>
            <select
              className="mt-1 w-full rounded-md border border-[var(--pf-border)] px-3 py-2 text-sm"
              value={form.kind}
              onChange={(e) =>
                setForm({ ...form, kind: e.target.value as Voucher["kind"] })
              }
            >
              <option value="checkout_discount">Checkout discount</option>
              <option value="pro_trial">Pro upgrade (time-limited)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[var(--pf-gray-700)]">Audience</span>
            <select
              className="mt-1 w-full rounded-md border border-[var(--pf-border)] px-3 py-2 text-sm"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            >
              <option value="public">Public (anyone)</option>
              <option value="assigned">Assigned users only</option>
              <option value="affiliate">Affiliate referrals only</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[var(--pf-gray-700)]">Plan tier</span>
            <select
              className="mt-1 w-full rounded-md border border-[var(--pf-border)] px-3 py-2 text-sm"
              value={form.applicableTier}
              onChange={(e) => setForm({ ...form, applicableTier: e.target.value })}
            >
              <option value="any">Any</option>
              <option value="member">Member</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[var(--pf-gray-700)]">Billing interval</span>
            <select
              className="mt-1 w-full rounded-md border border-[var(--pf-border)] px-3 py-2 text-sm"
              value={form.applicableInterval}
              onChange={(e) => setForm({ ...form, applicableInterval: e.target.value })}
            >
              <option value="any">Any</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          {form.kind === "checkout_discount" ? (
            <>
              <label className="block text-sm">
                <span className="font-medium text-[var(--pf-gray-700)]">Discount</span>
                <select
                  className="mt-1 w-full rounded-md border border-[var(--pf-border)] px-3 py-2 text-sm"
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountType: e.target.value as "percent_off" | "amount_off",
                    })
                  }
                >
                  <option value="percent_off">Percent off</option>
                  <option value="amount_off">Amount off (cents)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-[var(--pf-gray-700)]">Value</span>
                <Input
                  className="mt-1"
                  type="number"
                  value={
                    form.discountType === "percent_off"
                      ? form.discountPercent
                      : form.discountAmountCents
                  }
                  onChange={(e) =>
                    setForm(
                      form.discountType === "percent_off"
                        ? { ...form, discountPercent: e.target.value }
                        : { ...form, discountAmountCents: e.target.value }
                    )
                  }
                />
              </label>
            </>
          ) : (
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-[var(--pf-gray-700)]">Pro trial days</span>
              <Input
                className="mt-1 max-w-xs"
                type="number"
                min={1}
                value={form.proTrialDays}
                onChange={(e) => setForm({ ...form, proTrialDays: e.target.value })}
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="font-medium text-[var(--pf-gray-700)]">Max total uses</span>
            <Input
              className="mt-1"
              placeholder="Unlimited"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[var(--pf-gray-700)]">Expires</span>
            <Input
              className="mt-1"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </label>
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? "Creating…" : "Create voucher"}
        </Button>
        <p className="text-xs text-[var(--pf-gray-500)]">
          Checkout discounts sync a Stripe promotion code automatically. Pro trials grant
          intelligence access without changing the Stripe subscription tier.
        </p>
      </form>

      <div className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Assign
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">Assign / affiliate grant</h2>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          For assigned or affiliate audience vouchers, paste the member user id (from Members tab).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            className="rounded-md border border-[var(--pf-border)] px-3 py-2 text-sm"
            value={grantVoucherId}
            onChange={(e) => setGrantVoucherId(e.target.value)}
          >
            <option value="">Select voucher…</option>
            {vouchers
              .filter((v) => v.audience === "assigned" || v.audience === "affiliate")
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code} ({v.audience})
                </option>
              ))}
          </select>
          <Input
            className="max-w-md"
            placeholder="User UUID"
            value={grantUserId}
            onChange={(e) => setGrantUserId(e.target.value)}
          />
          <Button type="button" variant="outline" disabled={grantBusy} onClick={submitGrant}>
            Grant
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="hidden px-4 py-3 md:table-cell">Type</th>
              <th className="hidden px-4 py-3 lg:table-cell">Audience</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pf-border)]">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--pf-gray-500)]">
                  No vouchers yet.
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold">{v.code}</div>
                    <div className="text-xs text-[var(--pf-gray-500)]">{v.label}</div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {KIND_LABEL[v.kind]}
                    {v.kind === "checkout_discount" && v.discount_percent
                      ? ` · ${v.discount_percent}%`
                      : null}
                    {v.kind === "checkout_discount" && v.discount_amount_cents
                      ? ` · $${(v.discount_amount_cents / 100).toFixed(0)}`
                      : null}
                    {v.kind === "pro_trial" && v.pro_trial_days
                      ? ` · ${v.pro_trial_days}d`
                      : null}
                  </td>
                  <td className="hidden px-4 py-3 capitalize lg:table-cell">{v.audience}</td>
                  <td className="px-4 py-3">
                    {v.redemptionCount}
                    {v.max_redemptions != null ? ` / ${v.max_redemptions}` : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(v)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        v.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]"
                      )}
                    >
                      {v.active ? "Active" : "Off"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
