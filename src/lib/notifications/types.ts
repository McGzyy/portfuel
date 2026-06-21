export type NotificationType =
  | "comment_on_call"
  | "vote_on_call"
  | "watchlist_call"
  | "followed_member_call"
  | "desk_portfolio_update"
  | "call_milestone"
  | "direct_message"
  | "watchlist_price_move"
  | "watchlist_earnings"
  | "watchlist_plan_level"
  | "admin_churn_feedback"
  | "admin_support_ticket"
  | "admin_desk_discovery"
  | "support_ticket_reply"
  | "support_ticket_opened"
  | "support_ticket_idle_warning"
  | "support_ticket_status"
  | "billing_payment_failed"
  | "new_follower";

export const WATCHLIST_ALERT_NOTIFICATION_TYPES: NotificationType[] = [
  "watchlist_price_move",
  "watchlist_earnings",
  "watchlist_plan_level",
];

export function isWatchlistPushType(type: NotificationType): boolean {
  return (
    type === "watchlist_call" ||
    WATCHLIST_ALERT_NOTIFICATION_TYPES.includes(type)
  );
}

export type UserNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  snoozed_until?: string | null;
  created_at: string;
  actor_username?: string | null;
};
