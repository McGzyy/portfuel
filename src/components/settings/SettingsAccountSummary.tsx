import Link from "next/link";
import { formatTierPriceLong } from "@/lib/marketing/plans";
import type { BillingInterval } from "@/lib/stripe/config";
import { cn } from "@/lib/utils";

export function SettingsAccountSummary({
  username,
  displayName,
  subscriptionStatus,
  membershipTier,
  billingInterval,
  emailVerified,
  memberSince,
}: {
  username: string;
  displayName: string | null;
  subscriptionStatus: "pending" | "active" | "cancelled";
  membershipTier: "member" | "pro" | null;
  billingInterval: BillingInterval | null;
  emailVerified: boolean;
  memberSince: string;
}) {
  const tierLabel =
    membershipTier === "pro"
      ? "Pro Intelligence"
      : membershipTier === "member"
        ? "Member"
        : subscriptionStatus === "cancelled"
          ? "Cancelled"
          : "Pending";

  const statusTone =
    subscriptionStatus === "active"
      ? "bg-emerald-100 text-emerald-800"
      : subscriptionStatus === "cancelled"
        ? "bg-rose-100 text-rose-800"
        : "bg-amber-100 text-amber-900";

  return (
    <section className="pf-workspace-panel p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Signed in as
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--foreground)] sm:text-xl">
            {displayName ?? username}
          </h2>
          <p className="mt-0.5 font-mono text-sm text-[var(--pf-gray-500)]">@{username}</p>
          <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
            Member since{" "}
            {new Date(memberSince).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <span className={cn("rounded-full px-2.5 py-1 text-center text-xs font-bold sm:text-left", statusTone)}>
            {subscriptionStatus === "active" ? "Active" : subscriptionStatus}
          </span>
          <span className="rounded-full bg-[var(--pf-red)] px-2.5 py-1 text-center text-xs font-bold text-white sm:text-left">
            {tierLabel}
          </span>
          {billingInterval === "annual" ? (
            <span className="rounded-full border border-[var(--pf-border)] bg-white px-2.5 py-1 text-center text-xs font-semibold text-[var(--pf-gray-700)] sm:text-left">
              Annual
            </span>
          ) : null}
          <span
            className={cn(
              "col-span-2 rounded-full px-2.5 py-1 text-center text-xs font-semibold sm:col-span-1 sm:text-left",
              emailVerified
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-900"
            )}
          >
            {emailVerified ? "Email verified" : "Email not verified"}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-[var(--pf-border)] pt-4 text-xs font-semibold sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
        <Link href={`/member/${username}`} className="text-[var(--pf-red)] hover:underline">
          Public profile →
        </Link>
        {membershipTier === "member" && subscriptionStatus === "active" ? (
          <span className="font-normal leading-relaxed text-[var(--pf-gray-500)] sm:font-semibold">
            Pro from {formatTierPriceLong("pro")} — upgrade in Billing
          </span>
        ) : null}
      </div>
    </section>
  );
}
