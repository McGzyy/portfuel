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
  | "watchlist_plan_level";

export const WATCHLIST_ALERT_NOTIFICATION_TYPES: NotificationType[] = [
  "watchlist_price_move",
  "watchlist_earnings",
  "watchlist_plan_level",
];

export type UserNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
  actor_username?: string | null;
};
