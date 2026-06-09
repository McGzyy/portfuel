import { createServiceClient } from "@/lib/db/supabase";
import { sendPortfuelEmail } from "@/lib/email/client";
import { isEmailConfigured, getAppUrl } from "@/lib/email/config";
import type {
  SupportCategory,
  SupportTicketMessageRow,
  SupportTicketMessageWithAuthor,
  SupportTicketRow,
  SupportTicketStatus,
  SupportTicketWithUser,
} from "@/lib/support/types";
import {
  formatTicketRef,
  supportCategoryLabel,
  supportStatusLabel,
} from "@/lib/support/types";

export type CreateSupportTicketInput = {
  userId: string;
  category: SupportCategory;
  subject: string;
  message: string;
};

export type PostSupportMessageInput = {
  ticketId: string;
  authorUserId: string;
  authorRole: "member" | "admin";
  body: string;
};

async function fetchAdminNotifyEmails(): Promise<string[]> {
  const fromEnv =
    process.env.ADMIN_NOTIFY_EMAIL?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const db = createServiceClient();
  const { data } = await db.from("users").select("email").eq("role", "admin");
  const adminEmails = (data ?? [])
    .map((row) => row.email?.trim())
    .filter((email): email is string => Boolean(email));

  return [...new Set([...fromEnv, ...adminEmails])];
}

async function attachUsers(
  rows: SupportTicketRow[]
): Promise<SupportTicketWithUser[]> {
  if (!rows.length) return [];
  const db = createServiceClient();
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: users } = await db
    .from("users")
    .select("id, username, display_name, email")
    .in("id", userIds);

  const userMap = new Map(
    (users ?? []).map((u) => [
      u.id,
      {
        username: u.username as string,
        display_name: u.display_name as string | null,
        email: u.email as string | null,
      },
    ])
  );

  return rows.map((row) => {
    const user = userMap.get(row.user_id);
    return {
      ...row,
      username: user?.username ?? "unknown",
      display_name: user?.display_name ?? null,
      email: user?.email ?? null,
    };
  });
}

async function fetchTicketWithUser(
  ticketId: string
): Promise<SupportTicketWithUser | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[support/fetch-ticket]", error);
    return null;
  }

  const [withUser] = await attachUsers([data as SupportTicketRow]);
  return withUser ?? null;
}

async function notifyAdminsNewTicket(ticket: SupportTicketWithUser, preview: string) {
  const db = createServiceClient();
  const { data: admins } = await db.from("users").select("id").eq("role", "admin");
  if (!admins?.length) return;

  const memberLabel = ticket.display_name?.trim() || ticket.username;
  const ref = formatTicketRef(ticket.ticket_number);
  const title = `Support ticket ${ref}`;
  const body = `${memberLabel} · ${supportCategoryLabel(ticket.category)} — ${ticket.subject}${
    preview ? ` — "${preview.slice(0, 100)}"` : ""
  }`;

  const rows = admins.map((admin) => ({
    user_id: admin.id,
    type: "admin_support_ticket",
    title,
    body,
    href: `/admin?tab=support&ticket=${ticket.id}`,
  }));

  const { error } = await db.from("user_notifications").insert(rows as never);
  if (error) console.error("[support/admin-in-app]", error);

  if (isEmailConfigured()) {
    const recipients = await fetchAdminNotifyEmails();
    if (recipients.length) {
      const url = `${getAppUrl()}/admin?tab=support&ticket=${ticket.id}`;
      await Promise.all(
        recipients.map((to) =>
          sendPortfuelEmail({
            to,
            subject: `[PortFuel] ${title}`,
            html: `<p>${body}</p><p><a href="${url}">Open in admin</a></p>`,
            text: `${body}\n\nOpen: ${url}`,
          })
        )
      ).catch((e) => console.error("[support/admin-email]", e));
    }
  }

  await db
    .from("support_tickets")
    .update({ admin_notified_at: new Date().toISOString() } as never)
    .eq("id", ticket.id);
}

async function notifyMemberReply(
  ticket: SupportTicketWithUser,
  preview: string
): Promise<void> {
  const db = createServiceClient();
  const ref = formatTicketRef(ticket.ticket_number);
  const title = `Reply on ${ref}`;
  const body = preview.slice(0, 200);

  const { error } = await db.from("user_notifications").insert({
    user_id: ticket.user_id,
    type: "support_ticket_reply",
    title,
    body,
    href: `/dashboard/help?view=tickets&ticket=${ticket.id}`,
  } as never);

  if (error) console.error("[support/member-in-app]", error);

  if (ticket.email && isEmailConfigured()) {
    const url = `${getAppUrl()}/dashboard/help?view=tickets&ticket=${ticket.id}`;
    await sendPortfuelEmail({
      to: ticket.email,
      subject: `[PortFuel] ${title}`,
      html: `<p>Support replied on <strong>${ticket.subject}</strong>.</p><p>${preview.slice(0, 500)}</p><p><a href="${url}">View ticket</a></p>`,
      text: `Support replied on ${ticket.subject}.\n\n${preview}\n\nView: ${url}`,
    }).catch((e) => console.error("[support/member-email]", e));
  }
}

async function attachMessageAuthors(
  messages: SupportTicketMessageRow[]
): Promise<SupportTicketMessageWithAuthor[]> {
  if (!messages.length) return [];
  const db = createServiceClient();
  const authorIds = [
    ...new Set(messages.map((m) => m.author_user_id).filter(Boolean)),
  ] as string[];

  const { data: users } = authorIds.length
    ? await db
        .from("users")
        .select("id, username, display_name")
        .in("id", authorIds)
    : { data: [] };

  const userMap = new Map(
    (users ?? []).map((u) => [
      u.id,
      {
        username: u.username as string,
        display_name: u.display_name as string | null,
      },
    ])
  );

  return messages.map((msg) => {
    const author = msg.author_user_id ? userMap.get(msg.author_user_id) : null;
    return {
      ...msg,
      author_username: author?.username ?? null,
      author_display_name: author?.display_name ?? null,
    };
  });
}

export async function createSupportTicket(
  input: CreateSupportTicketInput
): Promise<{ id: string; ticketNumber: number }> {
  const db = createServiceClient();
  const subject = input.subject.trim();
  const message = input.message.trim();
  const now = new Date().toISOString();

  const { data: ticket, error } = await db
    .from("support_tickets")
    .insert({
      user_id: input.userId,
      category: input.category,
      subject,
      status: "waiting_on_support",
      last_message_at: now,
      updated_at: now,
    } as never)
    .select("id, ticket_number")
    .single();

  if (error || !ticket) {
    console.error("[support/create]", error);
    throw new Error("insert_failed");
  }

  const { error: msgErr } = await db.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    author_user_id: input.userId,
    author_role: "member",
    body: message,
  } as never);

  if (msgErr) {
    console.error("[support/create-message]", msgErr);
    throw new Error("message_failed");
  }

  const full = await fetchTicketWithUser(ticket.id);
  if (full) {
    await notifyAdminsNewTicket(full, message);
  }

  return { id: ticket.id, ticketNumber: ticket.ticket_number as number };
}

export async function listMemberSupportTickets(
  userId: string,
  limit = 50
): Promise<SupportTicketWithUser[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return attachUsers((data ?? []) as SupportTicketRow[]);
}

export async function listAdminSupportTickets(
  limit = 100
): Promise<SupportTicketWithUser[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("support_tickets")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return attachUsers((data ?? []) as SupportTicketRow[]);
}

export async function getSupportTicketForMember(
  ticketId: string,
  userId: string
): Promise<{
  ticket: SupportTicketWithUser;
  messages: SupportTicketMessageWithAuthor[];
} | null> {
  const ticket = await fetchTicketWithUser(ticketId);
  if (!ticket || ticket.user_id !== userId) return null;

  const db = createServiceClient();
  const { data, error } = await db
    .from("support_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const messages = await attachMessageAuthors((data ?? []) as SupportTicketMessageRow[]);
  return { ticket, messages };
}

export async function getSupportTicketAdmin(ticketId: string): Promise<{
  ticket: SupportTicketWithUser;
  messages: SupportTicketMessageWithAuthor[];
} | null> {
  const ticket = await fetchTicketWithUser(ticketId);
  if (!ticket) return null;

  const db = createServiceClient();
  const { data, error } = await db
    .from("support_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const messages = await attachMessageAuthors((data ?? []) as SupportTicketMessageRow[]);
  return { ticket, messages };
}

export async function postSupportTicketMessage(
  input: PostSupportMessageInput
): Promise<void> {
  const db = createServiceClient();
  const body = input.body.trim();
  const now = new Date().toISOString();

  const ticket = await fetchTicketWithUser(input.ticketId);
  if (!ticket) throw new Error("ticket_not_found");

  if (input.authorRole === "member" && ticket.user_id !== input.authorUserId) {
    throw new Error("forbidden");
  }

  if (ticket.status === "closed") {
    throw new Error("ticket_closed");
  }

  const nextStatus: SupportTicketStatus =
    input.authorRole === "admin" ? "waiting_on_member" : "waiting_on_support";

  const { error: msgErr } = await db.from("support_ticket_messages").insert({
    ticket_id: input.ticketId,
    author_user_id: input.authorUserId,
    author_role: input.authorRole,
    body,
  } as never);

  if (msgErr) {
    console.error("[support/reply]", msgErr);
    throw new Error("message_failed");
  }

  await db
    .from("support_tickets")
    .update({
      status: nextStatus,
      last_message_at: now,
      updated_at: now,
      resolved_at: null,
    } as never)
    .eq("id", input.ticketId);

  if (input.authorRole === "admin") {
    await notifyMemberReply(ticket, body);
  } else {
    await notifyAdminsNewTicket(ticket, body);
  }
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus
): Promise<void> {
  const db = createServiceClient();
  const now = new Date().toISOString();
  const resolved_at =
    status === "resolved" || status === "closed" ? now : null;

  const { error } = await db
    .from("support_tickets")
    .update({
      status,
      updated_at: now,
      resolved_at,
    } as never)
    .eq("id", ticketId);

  if (error) {
    console.error("[support/status]", error);
    throw new Error("update_failed");
  }
}

export function adminSupportPanelUrl(ticketId?: string): string {
  const base = `${getAppUrl()}/admin?tab=support`;
  return ticketId ? `${base}&ticket=${ticketId}` : base;
}

export function memberTicketUrl(ticketId: string): string {
  return `/dashboard/help?view=tickets&ticket=${ticketId}`;
}

export function statusTone(
  status: SupportTicketStatus
): "open" | "waiting" | "done" {
  if (status === "resolved" || status === "closed") return "done";
  if (status === "waiting_on_member") return "waiting";
  return "open";
}

export { supportStatusLabel };
