import { getAppUrl } from "@/lib/email/config";
import type { SupportTicketStatus } from "@/lib/support/types";

export function statusTone(
  status: SupportTicketStatus
): "open" | "waiting" | "done" {
  if (status === "resolved" || status === "closed") return "done";
  if (status === "waiting_on_member") return "waiting";
  return "open";
}

export function adminSupportPanelUrl(ticketId?: string): string {
  const base = `${getAppUrl()}/admin?tab=support`;
  return ticketId ? `${base}&ticket=${ticketId}` : base;
}

export function memberTicketUrl(ticketId: string): string {
  return `/dashboard/help?view=tickets&ticket=${ticketId}`;
}
