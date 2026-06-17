"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import {
  SupportAttachmentLinks,
  SupportAttachmentPicker,
  uploadTicketAttachments,
} from "@/components/help/SupportAttachmentPicker";
import type { SupportAttachmentView } from "@/lib/support/attachments";
import {
  SUPPORT_CATEGORIES,
  formatTicketRef,
  supportCategoryLabel,
  supportStatusLabel,
  type SupportCategory,
  type SupportTicketMessageWithAuthor,
  type SupportTicketWithUser,
} from "@/lib/support/types";
import { statusTone } from "@/lib/support/display";
import { discordTicketChannelUrl } from "@/lib/discord/support-tickets";
import { helpSectionHref, type HelpSectionId } from "@/lib/help/content";
import { cn, timeAgo } from "@/lib/utils";

function StatusBadge({
  status,
  emphasizeReply,
}: {
  status: SupportTicketWithUser["status"];
  emphasizeReply?: boolean;
}) {
  const tone = statusTone(status);
  const awaitingReply = status === "waiting_on_member";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        awaitingReply && emphasizeReply
          ? "bg-amber-500 text-white"
          : tone === "done" && "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]",
        !(awaitingReply && emphasizeReply) && tone === "waiting" && "bg-amber-100 text-amber-800",
        !(awaitingReply && emphasizeReply) && tone === "open" && "bg-emerald-100 text-emerald-800"
      )}
    >
      {awaitingReply && emphasizeReply ? "Reply needed" : supportStatusLabel(status)}
    </span>
  );
}

function TicketThread({
  ticket,
  messages,
  attachments,
  onReply,
  onResolve,
  replying,
  resolving,
}: {
  ticket: SupportTicketWithUser;
  messages: SupportTicketMessageWithAuthor[];
  attachments: SupportAttachmentView[];
  onReply: (body: string, files: File[]) => Promise<void>;
  onResolve: () => Promise<void>;
  replying: boolean;
  resolving: boolean;
}) {
  const [body, setBody] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const closed = ticket.status === "closed" || ticket.status === "resolved";
  const discordUrl = discordTicketChannelUrl(ticket);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError("");
    try {
      await onReply(body.trim(), replyFiles);
      setBody("");
      setReplyFiles([]);
    } catch {
      setError("Could not send reply. Try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="pf-help-command-bar pf-workspace-panel overflow-hidden p-0">
        <div className="border-b border-[var(--pf-border)] px-4 py-3 font-mono text-xs text-[var(--pf-gray-500)]">
          <span className="text-[var(--pf-red)]">{formatTicketRef(ticket.ticket_number)}</span>
          <span className="text-[var(--pf-gray-400)]"> · </span>
          {supportCategoryLabel(ticket.category)}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[var(--foreground)]">{ticket.subject}</h3>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
              Opened {timeAgo(ticket.created_at)}
            </p>
            {discordUrl ? (
              <p className="mt-2 text-xs">
                <a
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--pf-red)] hover:underline"
                >
                  Open Discord channel →
                </a>
                <span className="text-[var(--pf-gray-400)]"> · replies sync both ways</span>
              </p>
            ) : null}
          </div>
          <StatusBadge status={ticket.status} />
          {!closed ? (
            <button
              type="button"
              onClick={() => void onResolve()}
              disabled={resolving}
              className="rounded-lg border border-[var(--pf-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] transition-colors hover:bg-[var(--pf-gray-50)] disabled:opacity-50"
            >
              {resolving ? "Closing…" : "Mark resolved"}
            </button>
          ) : null}
        </div>
      </div>

      <section className="pf-workspace-panel divide-y divide-[var(--pf-border)] overflow-hidden">
        {messages.map((msg) => {
          const isStaff = msg.author_role === "admin";
          const label = isStaff
            ? "PortFuel Support"
            : msg.author_display_name?.trim() || msg.author_username || "You";
          return (
            <div
              key={msg.id}
              className={cn("px-4 py-4 sm:px-5", isStaff && "bg-[var(--pf-gray-50)]/80")}
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
              <SupportAttachmentLinks attachments={attachments} messageId={msg.id} />
            </div>
          );
        })}
      </section>

      {closed ? (
        <p className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-sm text-[var(--pf-gray-600)]">
          This ticket is closed. Open a new ticket if you need more help.
        </p>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="pf-workspace-panel space-y-3 p-4 sm:p-5">
          <label className="block text-sm font-semibold text-[var(--foreground)]">Your reply</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={8000}
            placeholder="Add details for the support team…"
            className="w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-[var(--pf-red)] focus:ring-2"
          />
          <SupportAttachmentPicker
            files={replyFiles}
            onChange={setReplyFiles}
            disabled={replying}
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={replying || !body.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--pf-black)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send reply
          </button>
        </form>
      )}
    </div>
  );
}

function NewTicketForm({
  onCreated,
  sectionId,
  defaultOpen = false,
  defaultSubject = "",
  defaultMessage = "",
  defaultCategory = "technical" as SupportCategory,
}: {
  onCreated: (ticketId: string) => void;
  sectionId: HelpSectionId;
  defaultOpen?: boolean;
  defaultSubject?: string;
  defaultMessage?: string;
  defaultCategory?: SupportCategory;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [category, setCategory] = useState<SupportCategory>(defaultCategory);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      if (!res.ok) {
        setError("Could not create ticket. Check fields and try again.");
        return;
      }
      const json = (await res.json()) as { id: string; messageId?: string };
      if (attachFiles.length > 0 && json.messageId) {
        try {
          await uploadTicketAttachments({
            ticketId: json.id,
            messageId: json.messageId,
            files: attachFiles,
          });
        } catch (uploadErr) {
          setError(
            uploadErr instanceof Error
              ? uploadErr.message
              : "Ticket created but attachments failed to upload."
          );
          onCreated(json.id);
          return;
        }
      }
      onCreated(json.id);
      setOpen(false);
      setSubject("");
      setMessage("");
      setAttachFiles([]);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--pf-red)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--pf-shadow-sm)]"
      >
        <Plus className="h-4 w-4" />
        New support ticket
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="pf-workspace-panel space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[var(--foreground)]">New ticket</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SupportCategory)}
          className="w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2.5 text-sm"
        >
          {SUPPORT_CATEGORIES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="Short summary of the issue"
          className="w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2.5 text-sm"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={8000}
          placeholder="Include steps to reproduce, screenshots links, or billing email if relevant…"
          className="w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2.5 text-sm"
          required
        />
      </div>

      <SupportAttachmentPicker files={attachFiles} onChange={setAttachFiles} disabled={saving} />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[var(--pf-black)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Submit ticket"}
      </button>

      <p className="text-center text-xs text-[var(--pf-gray-500)]">
        <Link href={helpSectionHref(sectionId)} className="font-semibold text-[var(--pf-red)] hover:underline">
          Browse docs
        </Link>{" "}
        — many questions are answered there first.
      </p>
    </form>
  );
}

export function SupportTicketsPanel({ sectionId }: { sectionId: HelpSectionId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticket");
  const openNew = searchParams.get("new") === "1";
  const fromPage = searchParams.get("from") ?? "";
  const prefilledSubject = searchParams.get("subject")?.trim() ?? "";
  const prefilledMessage = searchParams.get("message")?.trim() ?? "";
  const prefilledCategoryRaw = searchParams.get("category")?.trim();
  const prefilledCategory =
    prefilledCategoryRaw === "billing" ||
    prefilledCategoryRaw === "account" ||
    prefilledCategoryRaw === "calls" ||
    prefilledCategoryRaw === "technical" ||
    prefilledCategoryRaw === "other"
      ? prefilledCategoryRaw
      : undefined;
  const reportSubject = prefilledSubject || (fromPage ? `Issue on ${fromPage}` : "");
  const reportMessage =
    prefilledMessage ||
    (fromPage ? `Page: ${fromPage}\n\nDescribe what happened:\n` : "");

  const [tickets, setTickets] = useState<SupportTicketWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicketWithUser | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessageWithAuthor[]>([]);
  const [attachments, setAttachments] = useState<SupportAttachmentView[]>([]);
  const [listError, setListError] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) throw new Error("fetch_failed");
      const json = (await res.json()) as { tickets: SupportTicketWithUser[] };
      setTickets(json.tickets);
    } catch {
      setListError("Could not load tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTicket = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      if (!res.ok) throw new Error("fetch_failed");
      const json = (await res.json()) as {
        ticket: SupportTicketWithUser;
        messages: SupportTicketMessageWithAuthor[];
        attachments?: SupportAttachmentView[];
      };
      setActiveTicket(json.ticket);
      setMessages(json.messages);
      setAttachments(json.attachments ?? []);
    } catch {
      setActiveTicket(null);
      setMessages([]);
      setAttachments([]);
    } finally {
      setDetailLoading(false);
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
      setAttachments([]);
    }
  }, [ticketId, loadTicket]);

  async function handleResolve() {
    if (!ticketId) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (!res.ok) throw new Error("resolve_failed");
      await loadTicket(ticketId);
      await loadTickets();
    } finally {
      setResolving(false);
    }
  }

  async function handleReply(body: string, files: File[]) {
    if (!ticketId) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("reply_failed");
      const json = (await res.json()) as { messageId?: string };
      if (files.length > 0 && json.messageId) {
        await uploadTicketAttachments({
          ticketId,
          messageId: json.messageId,
          files,
        });
      }
      await loadTicket(ticketId);
      await loadTickets();
    } finally {
      setReplying(false);
    }
  }

  function openTicket(id: string) {
    router.push(`/dashboard/help?view=tickets&ticket=${id}`);
  }

  if (ticketId) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/help?view=tickets")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pf-gray-600)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          All tickets
        </button>
        {detailLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--pf-gray-400)]" />
          </div>
        ) : activeTicket ? (
          <TicketThread
            ticket={activeTicket}
            messages={messages}
            attachments={attachments}
            onReply={handleReply}
            onResolve={handleResolve}
            replying={replying}
            resolving={resolving}
          />
        ) : (
          <p className="text-sm text-[var(--pf-gray-500)]">Ticket not found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="pf-help-command-bar pf-workspace-panel overflow-hidden p-0">
        <div className="border-b border-[var(--pf-border)] px-4 py-3 font-mono text-xs text-[var(--pf-gray-500)]">
          <span className="text-[var(--pf-red)]">pf</span>
          <span className="text-[var(--pf-gray-400)]"> › </span>
          support › tickets
        </div>
        <div className="px-4 py-4 sm:px-5">
          <p className="text-sm leading-relaxed text-[var(--pf-gray-600)]">
            Open a ticket for billing disputes, access issues, or bugs. Typical response within one
            business day. Linked Discord members get a private support channel — open one in{" "}
            <span className="font-semibold">#open-ticket</span>.
          </p>
        </div>
      </section>

      <NewTicketForm
        sectionId={sectionId}
        defaultOpen={openNew && !ticketId}
        defaultSubject={reportSubject}
        defaultMessage={reportMessage}
        defaultCategory={prefilledCategory ?? "technical"}
        onCreated={(id) => {
          void loadTickets();
          openTicket(id);
        }}
      />

      {listError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {listError}
        </p>
      ) : null}

      <section className="pf-workspace-panel overflow-hidden">
        <div className="border-b border-[var(--pf-border)] px-4 py-3 sm:px-5">
          <h3 className="text-sm font-bold text-[var(--foreground)]">
            {loading ? "Loading…" : `Your tickets (${tickets.length})`}
          </h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--pf-gray-400)]" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--pf-gray-500)] sm:px-5">
            No tickets yet. Submit one above if you need help.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--pf-border)]">
            {tickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => openTicket(t.id)}
                  className={cn(
                    "flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors hover:bg-[var(--pf-gray-50)] sm:flex-row sm:items-center sm:justify-between sm:px-5",
                    t.status === "waiting_on_member" && "border-l-4 border-amber-500 bg-amber-50/40"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
                      {formatTicketRef(t.ticket_number)}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-[var(--foreground)]">
                      {t.subject}
                    </p>
                    <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                      {supportCategoryLabel(t.category)} · {timeAgo(t.last_message_at)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} emphasizeReply />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
