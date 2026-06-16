export const ADMIN_TABS = [
  { id: "analytics", label: "Analytics", group: "insights" },
  { id: "members", label: "Members", group: "people" },
  { id: "support", label: "Support", group: "people" },
  { id: "churn", label: "Churn", group: "people" },
  { id: "vouchers", label: "Vouchers", group: "billing" },
  { id: "launch", label: "Launch", group: "billing" },
  { id: "announcements", label: "Announcements", group: "content" },
  { id: "desk", label: "Desk", group: "content" },
  { id: "social", label: "Social", group: "growth" },
  { id: "discord", label: "Discord", group: "growth" },
  { id: "marketing", label: "Marketing", group: "growth" },
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number]["id"];

export const ADMIN_TAB_GROUPS = [
  { id: "insights", label: "Insights" },
  { id: "people", label: "Members & support" },
  { id: "billing", label: "Billing & launch" },
  { id: "content", label: "Content & desk" },
  { id: "growth", label: "Social & growth" },
] as const;

export function adminTabHref(tab: AdminTab): string {
  return tab === "analytics" ? "/admin" : `/admin?tab=${tab}`;
}

export type AdminMembersBillingFilter = "stripe" | "comp" | "trial";

export function adminMembersHref(opts?: { billing?: AdminMembersBillingFilter }): string {
  if (!opts?.billing) return "/admin?tab=members";
  return `/admin?tab=members&billing=${opts.billing}`;
}

export function parseAdminTab(raw: string | null): AdminTab {
  const found = ADMIN_TABS.find((t) => t.id === raw);
  return found?.id ?? "analytics";
}
