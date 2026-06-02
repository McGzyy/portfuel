import type { SessionPayload } from "@/lib/auth/session-types";

export class ModerationError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export function assertCanPublishCalls(session: SessionPayload): void {
  if (session.role === "admin") return;
  if (!session.canPublishCalls) throw new ModerationError("publish_restricted");
}

export function assertCanComment(session: SessionPayload): void {
  if (session.role === "admin") return;
  if (!session.canComment) throw new ModerationError("comment_restricted");
}

export function assertCanDm(session: SessionPayload): void {
  if (session.role === "admin") return;
  if (!session.canDm) throw new ModerationError("dm_restricted");
}

export function moderationErrorResponse(e: unknown) {
  if (e instanceof ModerationError) {
    return { error: e.code, status: 403 as const };
  }
  return null;
}
