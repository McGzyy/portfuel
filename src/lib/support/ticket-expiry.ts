import { createServiceClient } from "@/lib/db/supabase";
import {
  notifyDiscordSupportTicketChannelMessage,
  notifyDiscordSupportTicketIdleWarningDm,
} from "@/lib/discord/support-tickets";
import { updateSupportTicketStatus } from "@/lib/support/tickets";
import type { SupportTicketRow, SupportTicketWithUser } from "@/lib/support/types";
import { formatTicketRef } from "@/lib/support/types";

function idleWarnDays(): number {
  const n = Number(process.env.SUPPORT_TICKET_IDLE_WARN_DAYS ?? 5);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

function idleCloseDays(): number {
  const n = Number(process.env.SUPPORT_TICKET_IDLE_CLOSE_DAYS ?? 7);
  return Number.isFinite(n) && n > 0 ? n : 7;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function attachUser(row: SupportTicketRow): Promise<SupportTicketWithUser> {
  const db = createServiceClient();
  const { data: user } = await db
    .from("users")
    .select("username, display_name, email")
    .eq("id", row.user_id)
    .maybeSingle();

  return {
    ...row,
    username: user?.username ?? "unknown",
    display_name: user?.display_name ?? null,
    email: user?.email ?? null,
  };
}

export async function runSupportTicketExpiryCron(): Promise<{
  warned: number;
  closed: number;
}> {
  const warnDays = idleWarnDays();
  const closeDays = idleCloseDays();
  const db = createServiceClient();
  let warned = 0;
  let closed = 0;

  const { data: warnRows } = await db
    .from("support_tickets")
    .select("*")
    .eq("status", "waiting_on_member")
    .is("member_idle_warned_at", null)
    .lt("last_message_at", daysAgoIso(warnDays))
    .gt("last_message_at", daysAgoIso(closeDays));

  for (const row of warnRows ?? []) {
    const ticket = await attachUser(row as SupportTicketRow);
    const ref = formatTicketRef(ticket.ticket_number);
    const closeIn = Math.max(1, closeDays - warnDays);

    await db
      .from("support_tickets")
      .update({ member_idle_warned_at: new Date().toISOString() } as never)
      .eq("id", ticket.id);

    void notifyDiscordSupportTicketChannelMessage({
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      authorLabel: "PortFuel",
      authorRole: "system",
      body:
        `No member reply in **${warnDays} days**. This ticket will auto-close in **${closeIn} day${closeIn === 1 ? "" : "s"}** if we don't hear back.`,
    }).catch((e) => console.error("[support/expiry/warn-discord]", e));

    void notifyDiscordSupportTicketIdleWarningDm(ticket, closeIn).catch((e) =>
      console.error("[support/expiry/warn-dm]", e)
    );

    warned += 1;
  }

  const { data: closeRows } = await db
    .from("support_tickets")
    .select("*")
    .eq("status", "waiting_on_member")
    .lt("last_message_at", daysAgoIso(closeDays));

  for (const row of closeRows ?? []) {
    await updateSupportTicketStatus((row as SupportTicketRow).id, "closed");
    closed += 1;
  }

  return { warned, closed };
}
