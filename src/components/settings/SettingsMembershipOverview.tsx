import { Badge } from "@/components/ui/badge";
import {
  fetchMembershipOverview,
  formatOverviewDate,
  type MembershipBadge,
  type MembershipOverview,
} from "@/lib/billing/membership-overview";
import { cn } from "@/lib/utils";

function badgeLabel(kind: MembershipBadge): { text: string; variant?: "default" | "trusted" } {
  switch (kind) {
    case "trusted":
      return { text: "Trusted", variant: "trusted" };
    case "founding":
      return { text: "Founding member" };
    case "pro":
      return { text: "Pro Intelligence" };
    case "member":
      return { text: "Member" };
    case "comp_pro":
      return { text: "Comped Pro" };
    case "pro_trial":
      return { text: "Pro trial" };
    case "email_verified":
      return { text: "Email verified" };
    default:
      return { text: kind };
  }
}

function BadgeChip({ kind }: { kind: MembershipBadge }) {
  const { text, variant } = badgeLabel(kind);
  if (kind === "founding") {
    return (
      <Badge className="border border-amber-200 bg-amber-50 text-amber-800">{text}</Badge>
    );
  }
  if (kind === "pro") {
    return (
      <Badge className="border border-violet-200 bg-violet-50 text-violet-800">{text}</Badge>
    );
  }
  if (kind === "comp_pro" || kind === "pro_trial") {
    return (
      <Badge className="border border-sky-200 bg-sky-50 text-sky-800">{text}</Badge>
    );
  }
  if (kind === "email_verified") {
    return <Badge className="pf-badge-emerald">{text}</Badge>;
  }
  return <Badge variant={variant}>{text}</Badge>;
}

function StatCell({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold leading-snug text-[var(--pf-black)] sm:text-base">
        {value}
      </dd>
      {hint ? (
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--pf-gray-500)]">{hint}</p>
      ) : null}
    </div>
  );
}

function OverviewBody({
  overview,
  isStaffAdmin,
}: {
  overview: MembershipOverview;
  isStaffAdmin?: boolean;
}) {
  const isActive = overview.subscriptionStatus === "active";
  const cadence =
    overview.billingInterval === "annual"
      ? "Annual billing"
      : overview.billingInterval === "monthly"
        ? "Monthly billing"
        : null;

  const statusLabel = isStaffAdmin && overview.subscriptionStatus === "pending"
    ? "Staff access"
    : overview.cancelAtPeriodEnd
      ? "Cancelling"
      : overview.subscriptionStatus === "active"
        ? "Active"
        : overview.subscriptionStatus === "cancelled"
          ? "Cancelled"
          : "Pending";

  const statusTone = isStaffAdmin && overview.subscriptionStatus === "pending"
    ? "bg-sky-100 text-sky-800"
    : overview.cancelAtPeriodEnd
      ? "bg-amber-100 text-amber-900"
      : overview.subscriptionStatus === "active"
        ? "bg-emerald-100 text-emerald-800"
        : overview.subscriptionStatus === "cancelled"
          ? "bg-rose-100 text-rose-800"
          : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]";

  const planHeading =
    isStaffAdmin && !overview.effectiveTier && overview.subscriptionStatus === "pending"
      ? "Staff admin access"
      : overview.planLabel;

  const tierTenureLabel =
    overview.effectiveTier === "pro"
      ? "Pro member for"
      : overview.effectiveTier === "member"
        ? "Member for"
        : "On plan for";

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", statusTone)}>
              {statusLabel}
            </span>
            {cadence ? (
              <span className="rounded-full border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-1 text-xs font-semibold text-[var(--pf-gray-700)]">
                {cadence}
              </span>
            ) : null}
            {overview.billingSource === "comp" ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                Admin comp
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {planHeading}
          </h3>
          {isStaffAdmin && !overview.effectiveTier && overview.subscriptionStatus === "pending" ? (
            <p className="mt-1 text-sm font-semibold text-[var(--pf-gray-600)]">
              No paid subscription — full workspace via admin role
            </p>
          ) : overview.planPrice ? (
            <p className="mt-1 text-sm font-semibold text-[var(--pf-gray-600)]">
              {overview.planPrice}
            </p>
          ) : null}
        </div>
      </div>

      {overview.badges.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--pf-border)] pt-4">
          {overview.badges.map((badge) => (
            <BadgeChip key={badge} kind={badge} />
          ))}
        </div>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-[var(--pf-border)] pt-5 sm:grid-cols-3">
        {isActive && overview.callsPerWeek != null ? (
          <StatCell
            label="Calls / week"
            value={String(overview.callsPerWeek)}
            hint="Published call quota"
          />
        ) : null}

        {overview.subscribedSinceLabel ? (
          <StatCell
            label="Subscribed"
            value={overview.subscribedSinceLabel}
            hint={
              overview.subscribedSince
                ? `Since ${formatOverviewDate(overview.subscribedSince)}`
                : null
            }
          />
        ) : null}

        {isActive && overview.tierSinceLabel ? (
          <StatCell
            label={tierTenureLabel}
            value={overview.tierSinceLabel}
            hint={
              overview.tierSince ? `Since ${formatOverviewDate(overview.tierSince)}` : null
            }
          />
        ) : null}

        {isActive && overview.billingSource === "comp" ? (
          <StatCell
            label="Access until"
            value={
              overview.compAccessOpenEnded
                ? "∞"
                : formatOverviewDate(overview.compAccessUntil) ?? "—"
            }
            hint={
              overview.compAccessOpenEnded
                ? "Complimentary access · No end date"
                : overview.compAccessUntilLabel
                  ? `${overview.compAccessUntilLabel} remaining`
                  : "Complimentary access"
            }
            className="col-span-2 sm:col-span-1"
          />
        ) : null}

        {isActive && overview.cancelAtPeriodEnd && overview.accessUntil ? (
          <StatCell
            label="Access until"
            value={formatOverviewDate(overview.accessUntil) ?? "—"}
            hint={
              overview.accessUntilLabel
                ? `${overview.accessUntilLabel} remaining · Cancels at period end`
                : "Cancels at period end"
            }
            className="col-span-2 sm:col-span-1"
          />
        ) : null}

        {isActive && !overview.cancelAtPeriodEnd && overview.renewsOn ? (
          <StatCell
            label="Renews"
            value={formatOverviewDate(overview.renewsOn) ?? "—"}
            hint={
              overview.renewsInLabel ? `${overview.renewsInLabel} from now` : "Next billing date"
            }
            className="col-span-2 sm:col-span-1"
          />
        ) : null}

        {overview.proGrantedUntil ? (
          <StatCell
            label="Pro trial ends"
            value={formatOverviewDate(overview.proGrantedUntil) ?? "—"}
            hint={
              overview.proGrantDaysLeft
                ? `${overview.proGrantDaysLeft} remaining`
                : "Voucher grant"
            }
            className="col-span-2 sm:col-span-1"
          />
        ) : null}
      </dl>

      {overview.cancelAtPeriodEnd ? (
        <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950">
          Your subscription is set to cancel at the end of this billing period. Workspace access
          continues until then — you can reactivate anytime in Manage billing.
        </p>
      ) : null}

      {overview.subscriptionStatus === "cancelled" ? (
        <p className="mt-4 text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Your paid plan has ended. Resubscribe below to restore full workspace access.
        </p>
      ) : null}

      {isStaffAdmin && !overview.effectiveTier && overview.subscriptionStatus === "pending" ? (
        <p className="mt-4 text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Admin accounts skip Stripe billing. You have full workspace access — member feed, desk,
          journal, settings, and admin tools. Billing below only applies if you add a personal
          subscription for testing checkout.
        </p>
      ) : null}

      {overview.subscriptionStatus === "pending" && !isStaffAdmin ? (
        <p className="mt-4 text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Complete checkout to activate your membership and unlock the workspace.
        </p>
      ) : null}
    </>
  );
}

export async function SettingsMembershipOverview({
  userId,
  emailVerified,
  role,
}: {
  userId: string;
  emailVerified: boolean;
  role?: "admin" | "member";
}) {
  const overview = await fetchMembershipOverview(userId, { emailVerified });
  const isStaffAdmin = role === "admin";

  if (
    !isStaffAdmin &&
    !overview.stripeConfigured &&
    !overview.effectiveTier &&
    overview.subscriptionStatus === "pending"
  ) {
    return null;
  }

  return (
    <section className="pf-workspace-panel overflow-hidden p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Your plan
      </p>
      <OverviewBody overview={overview} isStaffAdmin={isStaffAdmin} />
    </section>
  );
}
