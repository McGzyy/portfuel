"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceEmptyState } from "@/components/calls/CallsEmptyState";
import { MessagesCommandHeader } from "@/components/messages/MessagesCommandHeader";
import { MessagesContextRail } from "@/components/messages/MessagesContextRail";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import { cn, timeAgo } from "@/lib/utils";
import { DmTypingIndicator } from "@/components/messages/DmTypingIndicator";
import { useDmTyping } from "@/components/messages/useDmTyping";
import { useWorkspaceActivityStreamLive } from "@/components/workspace/WorkspaceActivityProvider";
import {
  WORKSPACE_ACTIVITY_EVENT,
  type WorkspaceActivitySnapshot,
} from "@/lib/workspace/activity-events";
import type { DmMessage, DmThreadDetail, DmThreadSummary } from "@/lib/messages/types";

export function MessagesWorkspace({ proUnlocked = false }: { proUnlocked?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get("thread");
  const withParam = searchParams.get("with");

  const [threads, setThreads] = useState<DmThreadSummary[]>([]);
  const [activeThread, setActiveThread] = useState<DmThreadDetail | null>(null);
  const [activeId, setActiveId] = useState<string | null>(threadParam);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const dmUnreadRef = useRef<number | null>(null);
  const { otherTyping } = useDmTyping(activeId, draft);
  const streamLive = useWorkspaceActivityStreamLive();

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (res.ok) setThreads(data.threads ?? []);
  }, []);

  const loadThread = useCallback(async (threadId: string, silent = false) => {
    const res = await fetch(`/api/messages/${threadId}`);
    const data = await res.json();
    if (!res.ok) {
      if (!silent) setError("Could not load conversation.");
      return;
    }
    setActiveThread(data.thread as DmThreadDetail);
    setActiveId(threadId);
    if (!silent) {
      void loadThreads();
      window.dispatchEvent(new Event("portfuel:dm-unread-changed"));
    }
  }, [loadThreads]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadThreads();
        if (withParam && !threadParam) {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipientUsername: withParam }),
          });
          const data = await res.json();
          if (!cancelled && res.ok && data.threadId) {
            router.replace(`/dashboard/messages?thread=${data.threadId}`);
            return;
          }
        }
      } catch {
        if (!cancelled) setError("Could not load messages.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [withParam, loadThread, loadThreads, router]);

  useEffect(() => {
    if (!threadParam) {
      setActiveThread(null);
      setActiveId(null);
      return;
    }
    void loadThread(threadParam);
  }, [threadParam, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages.length, otherTyping]);

  useEffect(() => {
    const onActivity = (e: Event) => {
      const detail = (e as CustomEvent<WorkspaceActivitySnapshot>).detail;
      if (detail?.dmUnread == null) return;
      if (dmUnreadRef.current != null && detail.dmUnread === dmUnreadRef.current) return;
      dmUnreadRef.current = detail.dmUnread;
      void loadThreads();
      if (activeId) void loadThread(activeId, true);
    };
    window.addEventListener(WORKSPACE_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(WORKSPACE_ACTIVITY_EVENT, onActivity);
  }, [activeId, loadThread, loadThreads]);

  useEffect(() => {
    if (!activeId) return;
    const ms = streamLive ? 60_000 : 20_000;
    const id = setInterval(() => void loadThread(activeId, true), ms);
    return () => clearInterval(id);
  }, [activeId, loadThread, streamLive]);

  async function send() {
    if (!activeId || draft.trim().length < 1) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/messages/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Send failed.");
        return;
      }
      const msg = data.message as DmMessage;
      setActiveThread((t) =>
        t ? { ...t, messages: [...t.messages, msg] } : t
      );
      setDraft("");
      if (activeId) {
        void fetch(`/api/messages/${activeId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typing: false }),
        });
      }
      void loadThreads();
      window.dispatchEvent(new Event("portfuel:dm-unread-changed"));
    } catch {
      setError("Send failed.");
    } finally {
      setSending(false);
    }
  }

  function selectThread(id: string) {
    router.push(`/dashboard/messages?thread=${id}`);
  }

  const unreadThreads = threads.filter((t) => t.unread).length;

  const otherName =
    activeThread?.other_user.display_name ?? activeThread?.other_user.username;

  const otherReadAt = activeThread?.other_last_read_at
    ? new Date(activeThread.other_last_read_at).getTime()
    : 0;

  function messageSeen(createdAt: string): boolean {
    if (!otherReadAt) return false;
    return otherReadAt >= new Date(createdAt).getTime();
  }

  return (
    <WorkspaceContextShell
      pulseLabel="Messages pulse"
      rail={
        <MessagesContextRail threadCount={threads.length} unreadCount={unreadThreads} />
      }
      mainClassName="space-y-6 pb-14 lg:pb-0"
    >
    <div className="space-y-6">
      <MessagesCommandHeader
        threadCount={threads.length}
        unreadThreads={unreadThreads}
        activeName={otherName}
      />

      {error && !activeThread ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : null}

      {!loading && threads.length === 0 ? (
        <WorkspaceEmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Direct messages are member-to-member. Open someone's profile and tap Message to start a thread."
          showPublishCta={false}
          secondaryHref="/dashboard/rankings"
          secondaryLabel="Browse members"
        />
      ) : (
      <div className="pf-workspace-panel grid min-h-[420px] overflow-hidden lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--pf-border)] lg:border-b-0 lg:border-r">
          <p className="border-b border-[var(--pf-border)] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Conversations
          </p>
          {loading && threads.length === 0 ? (
            <p className="p-4 text-sm text-[var(--pf-gray-500)]">Loading…</p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto lg:max-h-[520px]">
              {threads.map((t) => {
                const name = t.other_user.display_name ?? t.other_user.username;
                const active = t.id === activeId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectThread(t.id)}
                      className={cn(
                        "w-full border-b border-[var(--pf-border)] px-4 py-3 text-left transition-colors",
                        active ? "bg-[var(--pf-gray-50)]" : "hover:bg-[var(--pf-gray-50)]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--pf-black)]">
                          {name}
                        </span>
                        {t.unread ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--pf-red)]" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-[var(--pf-gray-400)]">
                        @{t.other_user.username}
                      </p>
                      {t.last_message ? (
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--pf-gray-500)]">
                          {t.last_message.body}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[320px] flex-col">
          {activeThread ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--pf-black)]">{otherName}</p>
                  <Link
                    href={`/member/${activeThread.other_user.username}`}
                    className="font-mono text-[11px] text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
                  >
                    @{activeThread.other_user.username}
                  </Link>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex", m.is_mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        m.is_mine
                          ? "bg-[var(--pf-black)] text-white"
                          : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-800)]"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={cn(
                          "mt-1 flex items-center justify-end gap-2 text-[10px]",
                          m.is_mine ? "text-slate-400" : "text-[var(--pf-gray-400)]"
                        )}
                      >
                        <span>{timeAgo(m.created_at)}</span>
                        {m.is_mine && messageSeen(m.created_at) ? (
                          <span className="font-semibold text-slate-300">Seen</span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                ))}
                {otherTyping ? (
                  <DmTypingIndicator name={otherName ?? "Member"} />
                ) : null}
                <div ref={bottomRef} />
              </div>
              <form
                className="flex gap-2 border-t border-[var(--pf-border)] p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
                  rows={2}
                  placeholder="Write a message…"
                  className="min-h-[44px] flex-1 resize-none rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm" disabled={sending || draft.trim().length < 1}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {error ? <p className="px-3 pb-2 text-xs text-rose-600">{error}</p> : null}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[var(--pf-gray-500)]">
                <MessageSquare className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <p className="mt-4 text-sm font-semibold text-[var(--pf-gray-800)]">
                {loading ? "Loading conversation…" : "Select a conversation"}
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--pf-gray-500)]">
                {loading
                  ? "Fetching messages for this thread."
                  : "Pick a thread on the left, or message a member from their profile."}
              </p>
            </div>
          )}
        </section>
      </div>
      )}
    </div>
    </WorkspaceContextShell>
  );
}
