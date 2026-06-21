export const ADMIN_TABS = [
  { id: "analytics", label: "Analytics", group: "insights", icon: "bar-chart" },
  { id: "members", label: "Members", group: "people", icon: "users" },
  { id: "support", label: "Support", group: "people", icon: "life-buoy" },
  { id: "churn", label: "Churn", group: "people", icon: "user-minus" },
  { id: "vouchers", label: "Vouchers", group: "billing", icon: "ticket" },
  { id: "launch", label: "Launch", group: "billing", icon: "rocket" },
  { id: "announcements", label: "Announcements", group: "content", icon: "megaphone" },
  { id: "desk", label: "Desk", group: "content", icon: "briefcase" },
  { id: "discovery", label: "Discovery", group: "content", icon: "radar" },
  { id: "social", label: "Social", group: "growth", icon: "share-2" },
  { id: "discord", label: "Discord", group: "growth", icon: "message-circle" },
  { id: "marketing", label: "Marketing", group: "growth", icon: "target" },
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number]["id"];

export type AdminNavIcon = (typeof ADMIN_TABS)[number]["icon"];

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
