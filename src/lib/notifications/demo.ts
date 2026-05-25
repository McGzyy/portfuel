import type { UserNotification } from "@/lib/notifications/types";

export function getDemoNotifications(): UserNotification[] {
  const now = Date.now();
  return [
    {
      id: "demo-n1",
      type: "watchlist_call",
      title: "New call on NVDA",
      body: "FuelDesk published a long thesis",
      href: "/ticker/NVDA",
      read_at: null,
      created_at: new Date(now - 3600000).toISOString(),
      actor_username: "fueled",
    },
    {
      id: "demo-n2",
      type: "comment_on_call",
      title: "New comment on AMD",
      body: "TraderMike: Earnings drift still looks constructive…",
      href: "/ticker/AMD",
      read_at: null,
      created_at: new Date(now - 7200000).toISOString(),
      actor_username: "trader_mike",
    },
    {
      id: "demo-n3",
      type: "vote_on_call",
      title: "New vote on SPY",
      body: "@alpha_calls upvoted your call",
      href: "/ticker/SPY",
      read_at: new Date(now - 86400000).toISOString(),
      created_at: new Date(now - 86400000).toISOString(),
      actor_username: "alpha_calls",
    },
  ];
}
