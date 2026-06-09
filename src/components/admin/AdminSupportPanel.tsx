"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  SUPPORT_STATUSES,
  formatTicketRef,
  supportCategoryLabel,
  supportStatusLabel,
  type SupportTicketMessageWithAuthor,
  type SupportTicketStatus,
  type SupportTicketWithUser,
} from "@/lib/support/types";
import { statusTone } from "@/lib/support/tickets";
import { cn, timeAgo } from "@/lib/utils";

function StatusBadge({ status }: { status: SupportTicketStatus }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        tone === "done" && "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]",
        tone === "waiting" && "bg-amber-100 text-amber-800",
        tone === "open" && "bg-emerald-100 text-emerald-800"
      )}
    >
      {supportStatusLabel(status)}
    </span>
  );
}

function AdminTicketDetail({
  ticket,
  messages,
  onStatusChange,
  onReply,
  saving,
}: {
  ticket: SupportTicketWithUser;
  messages: SupportTicketMessageWithAuthor[];
  onStatusChange: (status: SupportTicketStatus) => Promise<void>;
  onReply: (body: string) => Promise<void>;
  saving: boolean;
}) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState(ticket.status);
  const memberLabel = ticket.display_name?.trim() || ticket.username;

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await onReply(body.trim());
    setBody("");
  }

  return (
    <div className="space-y-4">
      <div className="pf-workspace-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-[var(--pf-red)]">
              {formatTicketRef(ticket.ticket_number)}
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">{ticket.subject}</h3>
            <p className="mt-2 text-sm text-[var(--pf-gray-600)]">
              <Link
                href={`/admin/members/${ticket.user_id}`}
                className="font-semibold text-[var(--foreground)] hover:text-[var(--pf-red)] hover:underline"
              >
                {memberLabel}
              </Link>
              <span className="text-[var(--pf-gray-400)]"> @{ticket.username}</span>
              {ticket.email ? (
                <span className="text-[var(--pf-gray-400)]"> · {ticket.email}</span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
              {supportCategoryLabel(ticket.category)} · opened {timeAgo(ticket.created_at)}
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-[var(--pf-gray-500)]">Status</label>
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value as SupportTicketStatus;
              setStatus(next);
              void onStatusChange(next);
            }}
            disabled={saving}
            className="rounded-lg border border-[var(--pf-border)] bg-white px-3 py-1.5 text-sm"
          >
            {SUPPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {supportStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="pf-workspace-panel divide-y divide-[var(--pf-border)] overflow-hidden">
        {messages.map((msg) => {
          const isStaff = msg.author_role === "admin";
          const label = isStaff
            ? "Support"
            : msg.author_display_name?.trim() || msg.author_username || "Member";
          return (
            <div
              key={msg.id}
              className={cn("px-5 py-4", isStaff && "bg-[var(--pf-gray-50)]/80")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">{label}</span>
                <span className="text-[10px] text-[var(--pf-gray-400)]">
                  {timeAgo(msg.created_at)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--pf-gray-600)]">
                {msg.body}
              </p>
            </div>
          );
        })}
      </section>

      {ticket.status !== "closed" ? (
        <form onSubmit={(e) => void submitReply(e)} className="pf-workspace-panel space-y-3 p-5">
          <label className="text-sm font-semibold text-[var(--foreground)]">Staff reply</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={8000}
            placeholder="Reply to member — they receive in-app and email notification…"
            className="w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={saving || !body.trim()}
            className="rounded-lg bg-[var(--pf-red)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Sending…" : "Send reply"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function AdminSupportPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticket");

  const [tickets, setTickets] = useState<SupportTicketWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTicket, setActiveTicket] = useState<SupportTicketWithUser | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessageWithAuthor[]>([]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/support/tickets");
      if (!res.ok) throw new Error("fetch_failed");
      const json = (await res.json()) as { tickets: SupportTicketWithUser[] };
      setTickets(json.tickets);
    } catch {
      setError("Could not load support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTicket = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`);
      if (!res.ok) throw new Error("fetch_failed");
      const json = (await res.json()) as {
        ticket: SupportTicketWithUser;
        messages: SupportTicketMessageWithAuthor[];
      };
      setActiveTicket(json.ticket);
      setMessages(json.messages);
    } catch {
      setActiveTicket(null);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (ticketId) void loadTicket(ticketId);
    else {
      setActiveTicket(null);
      setMessages([]);
    }
  }, [ticketId, loadTicket]);

  async function handleStatusChange(status: SupportTicketStatus) {
    if (!ticketId) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadTicket(ticketId);
      await loadTickets();
    } finally {
      setSaving(false);
    }
  }

  async function handleReply(body: string) {
    if (!ticketId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("reply_failed");
      await loadTicket(ticketId);
      await loadTickets();
    } finally {
      setSaving(false);
    }
  }

  const openCount = tickets.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  ).length;

  if (ticketId && activeTicket) {
    return (
      <div className="mt-8 space-y-4">
        <button
          type="button"
          onClick={() => router.push("/admin?tab=support")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pf-gray-600)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Queue
        </button>
        <AdminTicketDetail
          ticket={activeTicket}
          messages={messages}
          onStatusChange={handleStatusChange}
          onReply={handleReply}
          saving={saving}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="pf-workspace-panel p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Support
        </p>
        <h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">Ticket queue</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Member support requests from the help center. Replies notify the member in-app and by email.
        </p>
      </section>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <section className="pf-workspace-panel overflow-hidden">
        <div className="border-b border-[var(--pf-border)] px-5 py-4">
          <h3 className="text-sm font-bold text-[var(--foreground)]">
            {loading
              ? "Loading…"
              : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} · ${openCount} open`}
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--pf-gray-400)]" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--pf-gray-500)]">
            No support tickets yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--pf-border)]">
            {tickets.map((t) => {
              const memberLabel = t.display_name?.trim() || t.username;
              return (
                <li key={t.id}>
                  <Link
                    href={`/admin?tab=support&ticket=${t.id}`}
                    className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-[var(--pf-gray-50)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
                        {formatTicketRef(t.ticket_number)}
                      </p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[var(--foreground)]">
                        {t.subject}
                      </p>
                      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                        {memberLabel} · {supportCategoryLabel(t.category)} · {timeAgo(t.last_message_at)}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
