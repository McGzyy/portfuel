import type { DmThreadDetail, DmThreadSummary } from "@/lib/messages/types";

const DEMO_OTHER = {
  id: "demo-user-ace",
  username: "ace",
  display_name: "Ace",
};

export function getDemoThreadSummaries(userId: string): DmThreadSummary[] {
  return [
    {
      id: "demo-thread-1",
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      other_user: DEMO_OTHER,
      last_message: {
        body: "Watching NVDA into earnings — what's your level?",
        sender_id: DEMO_OTHER.id,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      unread: true,
    },
  ];
}

export function getDemoThreadDetail(
  threadId: string,
  currentUserId: string
): DmThreadDetail | null {
  if (threadId !== "demo-thread-1") return null;
  const now = Date.now();
  return {
    id: threadId,
    other_user: DEMO_OTHER,
    other_last_read_at: new Date(now - 4800000).toISOString(),
    messages: [
      {
        id: "demo-msg-1",
        sender_id: DEMO_OTHER.id,
        body: "Hey — saw your TSLA call on the feed.",
        created_at: new Date(now - 7200000).toISOString(),
        is_mine: false,
      },
      {
        id: "demo-msg-2",
        sender_id: currentUserId,
        body: "Yeah, trimming into strength. You still long?",
        created_at: new Date(now - 5400000).toISOString(),
        is_mine: true,
      },
      {
        id: "demo-msg-3",
        sender_id: DEMO_OTHER.id,
        body: "Watching NVDA into earnings — what's your level?",
        created_at: new Date(now - 3600000).toISOString(),
        is_mine: false,
      },
    ],
  };
}
