export const SUPPORT_CATEGORIES = [
  { value: "billing", label: "Billing & membership" },
  { value: "account", label: "Account & access" },
  { value: "calls", label: "Calls & track record" },
  { value: "technical", label: "Technical issue" },
  { value: "other", label: "Other" },
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]["value"];

export const SUPPORT_STATUSES = [
  "open",
  "waiting_on_member",
  "waiting_on_support",
  "resolved",
  "closed",
] as const;

export type SupportTicketStatus = (typeof SUPPORT_STATUSES)[number];

export type SupportTicketRow = {
  id: string;
  ticket_number: number;
  user_id: string;
  category: SupportCategory;
  subject: string;
  status: SupportTicketStatus;
  priority: "normal" | "high";
  created_at: string;
  updated_at: string;
  last_message_at: string;
  resolved_at: string | null;
  discord_guild_id?: string | null;
  discord_thread_id?: string | null;
  discord_root_message_id?: string | null;
};

export type SupportTicketMessageRow = {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_role: "member" | "admin" | "system";
  body: string;
  created_at: string;
};

export type SupportTicketWithUser = SupportTicketRow & {
  username: string;
  display_name: string | null;
  email: string | null;
};

export type SupportTicketMessageWithAuthor = SupportTicketMessageRow & {
  author_username: string | null;
  author_display_name: string | null;
};

export function supportCategoryLabel(category: SupportCategory): string {
  return SUPPORT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function supportStatusLabel(status: SupportTicketStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "waiting_on_member":
      return "Awaiting your reply";
    case "waiting_on_support":
      return "With support";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

export function formatTicketRef(ticketNumber: number): string {
  return `PF-${ticketNumber}`;
}
