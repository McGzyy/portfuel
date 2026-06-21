import type { NotificationType } from "@/lib/notifications/types";
import type { EngagementAlertKind } from "@/lib/alerts/engagement-preferences";
import type { WatchlistAlertPrefs } from "@/lib/alerts/preferences";

export type AlertCategory =
  | "permanent"
  | "engagement"
  | "watchlist"
  | "admin";

export type AlertCatalogEntry = {
  type: NotificationType;
  category: AlertCategory;
  label: string;
  description: string;
  /** User-facing settings key when toggleable */
  engagementKey?: EngagementAlertKind;
  watchlistKey?: keyof WatchlistAlertPrefs;
  emailInstantDefault?: boolean;
  smsEligible?: boolean;
  pushEligible?: boolean;
};

/** Source of truth for alert coverage — keep in sync with createNotification paths. */
export const ALERT_CATALOG: AlertCatalogEntry[] = [
  {
    type: "comment_on_call",
    category: "engagement",
    label: "Comments on your calls",
    description: "When a member comments on a thesis you published.",
    engagementKey: "comments_on_my_calls",
    emailInstantDefault: true,
  },
  {
    type: "vote_on_call",
    category: "engagement",
    label: "Votes on your calls",
    description: "Upvotes and downvotes on your published calls.",
    engagementKey: "votes_on_my_calls",
    emailInstantDefault: true,
  },
  {
    type: "direct_message",
    category: "engagement",
    label: "Direct messages",
    description: "New private messages in your inbox.",
    engagementKey: "direct_messages",
    emailInstantDefault: true,
  },
  {
    type: "followed_member_call",
    category: "engagement",
    label: "Calls from people you follow",
    description: "When someone you follow publishes a new thesis.",
    engagementKey: "followed_member_calls",
    emailInstantDefault: true,
  },
  {
    type: "new_follower",
    category: "engagement",
    label: "New followers",
    description: "When a member starts following your profile.",
    engagementKey: "new_followers",
    emailInstantDefault: true,
  },
  {
    type: "call_milestone",
    category: "engagement",
    label: "Your call milestones",
    description:
      "Return targets, stop hits, pending-entry triggers, and expirations on your own calls.",
    engagementKey: "call_milestones",
    emailInstantDefault: true,
  },
  {
    type: "desk_portfolio_update",
    category: "engagement",
    label: "Fueled desk portfolio",
    description: "When the house desk opens, updates, or closes a model position.",
    engagementKey: "desk_portfolio_updates",
    emailInstantDefault: true,
  },
  {
    type: "watchlist_call",
    category: "watchlist",
    label: "Community calls on watchlist symbols",
    description: "New member calls on symbols in your watchlist.",
    watchlistKey: "community_calls",
    emailInstantDefault: true,
    smsEligible: true,
    pushEligible: true,
  },
  {
    type: "watchlist_price_move",
    category: "watchlist",
    label: "Watchlist price moves",
    description: "When a symbol moves beyond your ±% threshold since you added it.",
    watchlistKey: "price_move",
    emailInstantDefault: true,
    smsEligible: true,
    pushEligible: true,
  },
  {
    type: "watchlist_earnings",
    category: "watchlist",
    label: "Watchlist earnings",
    description: "Upcoming earnings dates for equities on your watchlist.",
    watchlistKey: "earnings",
    emailInstantDefault: true,
    smsEligible: true,
    pushEligible: true,
  },
  {
    type: "watchlist_plan_level",
    category: "watchlist",
    label: "Journal plan levels",
    description: "Entry, stop, and target crosses from your private journal.",
    watchlistKey: "plan_levels",
    emailInstantDefault: true,
    smsEligible: true,
    pushEligible: true,
  },
  {
    type: "support_ticket_opened",
    category: "permanent",
    label: "Support ticket opened",
    description: "Confirmation when you open a support case.",
    emailInstantDefault: true,
  },
  {
    type: "support_ticket_reply",
    category: "permanent",
    label: "Support ticket replies",
    description: "When PortFuel staff replies to your support ticket.",
    emailInstantDefault: true,
  },
  {
    type: "support_ticket_idle_warning",
    category: "permanent",
    label: "Support ticket idle warning",
    description: "Reminder before an inactive ticket auto-closes.",
    emailInstantDefault: true,
  },
  {
    type: "support_ticket_status",
    category: "permanent",
    label: "Support ticket status",
    description: "When your ticket is resolved or closed.",
    emailInstantDefault: true,
  },
  {
    type: "billing_payment_failed",
    category: "permanent",
    label: "Billing payment failed",
    description: "When a subscription renewal payment fails.",
    emailInstantDefault: true,
  },
  {
    type: "admin_support_ticket",
    category: "admin",
    label: "Admin: new support ticket",
    description: "Staff alert when a member opens or replies to a ticket.",
  },
  {
    type: "admin_churn_feedback",
    category: "admin",
    label: "Admin: cancellation feedback",
    description: "Staff alert when a member submits churn feedback.",
  },
  {
    type: "admin_desk_discovery",
    category: "admin",
    label: "Admin: desk discovery",
    description: "Staff alert when the discovery radar finds high-score setups.",
  },
];

export const PERMANENT_NOTIFICATION_TYPES: NotificationType[] = ALERT_CATALOG.filter(
  (e) => e.category === "permanent"
).map((e) => e.type);

export function isPermanentNotificationType(type: NotificationType): boolean {
  return PERMANENT_NOTIFICATION_TYPES.includes(type);
}

export function catalogEntryForType(type: NotificationType): AlertCatalogEntry | undefined {
  return ALERT_CATALOG.find((e) => e.type === type);
}
