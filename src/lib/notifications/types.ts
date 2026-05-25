export type NotificationType = "comment_on_call" | "vote_on_call" | "watchlist_call";

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
