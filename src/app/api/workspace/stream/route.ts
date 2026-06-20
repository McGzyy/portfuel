import { cookies } from "next/headers";
import { requireActiveMember } from "@/lib/auth/session";
import { FEED_SEEN_COOKIE, parseFeedSeenAt } from "@/lib/feed/last-seen";
import {
  fetchWorkspaceActivitySnapshot,
  WORKSPACE_STREAM_POLL_MS,
  type WorkspaceActivitySnapshot,
} from "@/lib/workspace/activity-snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sseChunk(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: Request) {
  let session;
  try {
    session = await requireActiveMember();
  } catch {
    return new Response("unauthorized", { status: 401 });
  }

  const cookieStore = await cookies();
  const feedSeenAt = parseFeedSeenAt(cookieStore.get(FEED_SEEN_COOKIE)?.value);

  let closed = false;
  let lastPayload = "";
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const pushSnapshot = async (kind: "activity" | "heartbeat") => {
        if (closed) return;
        try {
          const snapshot = await fetchWorkspaceActivitySnapshot(session.userId, feedSeenAt);
          const json = JSON.stringify(snapshot);
          if (kind === "activity" && json !== lastPayload) {
            lastPayload = json;
            controller.enqueue(sseChunk("activity", snapshot));
          } else if (kind === "heartbeat") {
            controller.enqueue(
              sseChunk("heartbeat", { at: snapshot.at } satisfies Pick<WorkspaceActivitySnapshot, "at">)
            );
          } else if (kind === "activity" && json === lastPayload) {
            controller.enqueue(
              sseChunk("heartbeat", { at: snapshot.at } satisfies Pick<WorkspaceActivitySnapshot, "at">)
            );
          }
        } catch (e) {
          console.error("[workspace/stream]", e);
          controller.enqueue(sseChunk("error", { message: "poll_failed" }));
        }
      };

      void pushSnapshot("activity");

      intervalId = setInterval(() => {
        void pushSnapshot("activity");
      }, WORKSPACE_STREAM_POLL_MS);

      request.signal.addEventListener("abort", () => {
        closed = true;
        if (intervalId) clearInterval(intervalId);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      closed = true;
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
