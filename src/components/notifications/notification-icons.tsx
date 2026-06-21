import {
  Bell,
  Calendar,
  CreditCard,
  Flame,
  LifeBuoy,
  LineChart,
  MessageCircle,
  MessageSquare,
  Radar,
  Target,
  ThumbsUp,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotificationType } from "@/lib/notifications/types";

export function iconForNotificationType(type: NotificationType | string): LucideIcon {
  switch (type) {
    case "watchlist_call":
      return TrendingUp;
    case "watchlist_price_move":
      return LineChart;
    case "watchlist_earnings":
      return Calendar;
    case "watchlist_plan_level":
      return Target;
    case "vote_on_call":
      return ThumbsUp;
    case "comment_on_call":
      return MessageSquare;
    case "followed_member_call":
      return UserPlus;
    case "desk_portfolio_update":
      return Flame;
    case "call_milestone":
      return Target;
    case "direct_message":
      return MessageCircle;
    case "admin_support_ticket":
    case "support_ticket_reply":
    case "support_ticket_opened":
    case "support_ticket_idle_warning":
    case "support_ticket_status":
      return LifeBuoy;
    case "billing_payment_failed":
      return CreditCard;
    case "new_follower":
      return Users;
    case "admin_churn_feedback":
      return Bell;
    case "admin_desk_discovery":
      return Radar;
    default:
      return Bell;
  }
}
