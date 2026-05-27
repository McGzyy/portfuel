import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoThreadDetail, getDemoThreadSummaries } from "@/lib/messages/demo";
import { DM_TYPING_TTL_MS } from "@/lib/messages/constants";
import { dmThreadKey } from "@/lib/messages/thread-key";
import { isDemoOtherTyping, setDemoTyping } from "@/lib/messages/typing-demo";
import type { DmMessage, DmThreadDetail, DmThreadSummary } from "@/lib/messages/types";
import { notifyDirectMessage } from "@/lib/notifications/service";

const PREVIEW_LEN = 120;

function previewBody(body: string): string {
  const t = body.trim();
  if (t.length <= PREVIEW_LEN) return t;
  return `${t.slice(0, PREVIEW_LEN - 1)}…`;
}

export async function findUserIdByUsername(
  username: string
): Promise<{ id: string; username: string; display_name: string | null } | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("id, username, display_name, subscription_status")
    .ilike("username", username.trim())
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    id: string;
    username: string;
    display_name: string | null;
    subscription_status: string;
  };
  if (row.subscription_status !== "active") return null;
  return { id: row.id, username: row.username, display_name: row.display_name };
}

async function assertParticipant(
  userId: string,
  threadId: string
): Promise<boolean> {
  const db = createServiceClient();
  const { data } = await db
    .from("dm_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function findOrCreateThread(
  userId: string,
  recipientId: string
): Promise<{ threadId: string } | { error: string }> {
  if (userId === recipientId) return { error: "self_message" };

  if (isDemoMode()) {
    return { threadId: "demo-thread-1" };
  }

  const key = dmThreadKey(userId, recipientId);
  const db = createServiceClient();

  const { data: existing } = await db
    .from("dm_threads")
    .select("id")
    .eq("thread_key", key)
    .maybeSingle();

  if (existing) {
    return { threadId: (existing as { id: string }).id };
  }

  const { data: thread, error: threadErr } = await db
    .from("dm_threads")
    .insert({ thread_key: key } as never)
    .select("id")
    .single();

  if (threadErr || !thread) {
    if (threadErr?.code === "23505") {
      const { data: retry } = await db
        .from("dm_threads")
        .select("id")
        .eq("thread_key", key)
        .maybeSingle();
      if (retry) return { threadId: (retry as { id: string }).id };
    }
    console.error("[messages/createThread]", threadErr);
    return { error: "db_error" };
  }

  const threadId = (thread as { id: string }).id;
  const { error: partErr } = await db.from("dm_participants").insert([
    { thread_id: threadId, user_id: userId },
    { thread_id: threadId, user_id: recipientId },
  ] as never);

  if (partErr) {
    console.error("[messages/participants]", partErr);
    return { error: "db_error" };
  }

  return { threadId };
}

export async function countUnreadDmThreads(userId: string): Promise<number> {
  const threads = await listThreads(userId);
  return threads.filter((t) => t.unread).length;
}

export async function listThreads(userId: string): Promise<DmThreadSummary[]> {
  if (isDemoMode()) return getDemoThreadSummaries(userId);

  const db = createServiceClient();
  const { data: memberships, error } = await db
    .from("dm_participants")
    .select("thread_id, last_read_at")
    .eq("user_id", userId);

  if (error) throw error;
  const threadIds = (memberships ?? []).map((m) => (m as { thread_id: string }).thread_id);
  if (threadIds.length === 0) return [];

  const { data: threads } = await db
    .from("dm_threads")
    .select("id, updated_at")
    .in("id", threadIds)
    .order("updated_at", { ascending: false });

  const summaries: DmThreadSummary[] = [];

  for (const t of threads ?? []) {
    const thread = t as { id: string; updated_at: string };
    const membership = (memberships ?? []).find(
      (m) => (m as { thread_id: string }).thread_id === thread.id
    ) as { last_read_at: string | null } | undefined;

    const { data: others } = await db
      .from("dm_participants")
      .select("user_id, users!inner(id, username, display_name)")
      .eq("thread_id", thread.id)
      .neq("user_id", userId)
      .limit(1);

    const otherRow = others?.[0] as
      | { user_id: string; users: { id: string; username: string; display_name: string | null } }
      | undefined;
    if (!otherRow) continue;

    const { data: lastMsg } = await db
      .from("dm_messages")
      .select("body, sender_id, created_at")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const last = lastMsg as {
      body: string;
      sender_id: string;
      created_at: string;
    } | null;

    const unread =
      Boolean(last) &&
      last!.sender_id !== userId &&
      (!membership?.last_read_at ||
        new Date(last!.created_at) > new Date(membership.last_read_at));

    summaries.push({
      id: thread.id,
      updated_at: thread.updated_at,
      other_user: {
        id: otherRow.users.id,
        username: otherRow.users.username,
        display_name: otherRow.users.display_name,
      },
      last_message: last
        ? {
            body: previewBody(last.body),
            sender_id: last.sender_id,
            created_at: last.created_at,
          }
        : null,
      unread,
    });
  }

  return summaries;
}

export async function getThreadDetail(
  userId: string,
  threadId: string
): Promise<DmThreadDetail | null> {
  if (isDemoMode()) return getDemoThreadDetail(threadId, userId);

  if (!(await assertParticipant(userId, threadId))) return null;

  const db = createServiceClient();

  const { data: others } = await db
    .from("dm_participants")
    .select("user_id, last_read_at, users!inner(id, username, display_name)")
    .eq("thread_id", threadId)
    .neq("user_id", userId)
    .limit(1);

  const otherRow = others?.[0] as
    | {
        users: { id: string; username: string; display_name: string | null };
        last_read_at: string | null;
      }
    | undefined;
  if (!otherRow) return null;

  const { data: rows } = await db
    .from("dm_messages")
    .select("id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  const messages: DmMessage[] = (rows ?? []).map((r) => {
    const row = r as { id: string; sender_id: string; body: string; created_at: string };
    return {
      id: row.id,
      sender_id: row.sender_id,
      body: row.body,
      created_at: row.created_at,
      is_mine: row.sender_id === userId,
    };
  });

  await markThreadRead(userId, threadId);

  return {
    id: threadId,
    other_user: otherRow.users,
    other_last_read_at: otherRow.last_read_at,
    messages,
  };
}

export async function markThreadRead(userId: string, threadId: string): Promise<void> {
  if (isDemoMode()) return;

  const db = createServiceClient();
  await db
    .from("dm_participants")
    .update({ last_read_at: new Date().toISOString() } as never)
    .eq("thread_id", threadId)
    .eq("user_id", userId);
}

export async function sendDirectMessage(input: {
  senderId: string;
  threadId: string;
  body: string;
}): Promise<{ message: DmMessage } | { error: string }> {
  const body = input.body.trim();
  if (body.length < 1 || body.length > 2000) return { error: "invalid_body" };

  if (isDemoMode()) {
    return {
      message: {
        id: `demo-msg-${Date.now()}`,
        sender_id: input.senderId,
        body,
        created_at: new Date().toISOString(),
        is_mine: true,
      },
    };
  }

  if (!(await assertParticipant(input.senderId, input.threadId))) {
    return { error: "forbidden" };
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  const { data: msg, error } = await db
    .from("dm_messages")
    .insert({
      thread_id: input.threadId,
      sender_id: input.senderId,
      body,
    } as never)
    .select("id, sender_id, body, created_at")
    .single();

  if (error || !msg) {
    console.error("[messages/send]", error);
    return { error: "db_error" };
  }

  await db
    .from("dm_threads")
    .update({ updated_at: now } as never)
    .eq("id", input.threadId);

  await setDmTyping(input.senderId, input.threadId, false);

  const row = msg as { id: string; sender_id: string; body: string; created_at: string };

  const { data: recipient } = await db
    .from("dm_participants")
    .select("user_id")
    .eq("thread_id", input.threadId)
    .neq("user_id", input.senderId)
    .limit(1)
    .maybeSingle();

  if (recipient) {
    const { data: sender } = await db
      .from("users")
      .select("username, display_name")
      .eq("id", input.senderId)
      .maybeSingle();
    const s = sender as { username: string; display_name: string | null } | null;
    await notifyDirectMessage({
      recipientId: (recipient as { user_id: string }).user_id,
      senderId: input.senderId,
      senderUsername: s?.username ?? "member",
      senderDisplayName: s?.display_name ?? null,
      threadId: input.threadId,
      preview: previewBody(body),
    });
  }

  return {
    message: {
      id: row.id,
      sender_id: row.sender_id,
      body: row.body,
      created_at: row.created_at,
      is_mine: true,
    },
  };
}

export async function openThreadWithUsername(
  userId: string,
  recipientUsername: string
): Promise<{ threadId: string } | { error: string }> {
  const recipient = await findUserIdByUsername(recipientUsername);
  if (!recipient) return { error: "user_not_found" };
  return findOrCreateThread(userId, recipient.id);
}

export async function setDmTyping(
  userId: string,
  threadId: string,
  typing: boolean
): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) {
    setDemoTyping(threadId, userId, typing);
    return { ok: true };
  }

  if (!(await assertParticipant(userId, threadId))) {
    return { error: "forbidden" };
  }

  const db = createServiceClient();
  if (!typing) {
    await db
      .from("dm_typing")
      .delete()
      .eq("thread_id", threadId)
      .eq("user_id", userId);
    return { ok: true };
  }

  const { error } = await db.from("dm_typing").upsert(
    {
      thread_id: threadId,
      user_id: userId,
      typing_at: new Date().toISOString(),
    } as never,
    { onConflict: "thread_id,user_id" }
  );

  if (error) {
    console.error("[messages/setTyping]", error);
    return { error: "db_error" };
  }

  return { ok: true };
}

export async function isOtherParticipantTyping(
  userId: string,
  threadId: string
): Promise<boolean> {
  if (isDemoMode()) {
    return isDemoOtherTyping(threadId, userId);
  }

  if (!(await assertParticipant(userId, threadId))) {
    return false;
  }

  const db = createServiceClient();
  const { data: other } = await db
    .from("dm_participants")
    .select("user_id")
    .eq("thread_id", threadId)
    .neq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!other) return false;

  const cutoff = new Date(Date.now() - DM_TYPING_TTL_MS).toISOString();
  const { data: typing } = await db
    .from("dm_typing")
    .select("typing_at")
    .eq("thread_id", threadId)
    .eq("user_id", (other as { user_id: string }).user_id)
    .gte("typing_at", cutoff)
    .maybeSingle();

  return Boolean(typing);
}
