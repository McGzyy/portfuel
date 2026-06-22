import type { SessionPayload } from "@/lib/auth/session-types";

/** Set by middleware after JWT verification — RSC must not re-hit Supabase on the same request. */
export const SESSION_TRUST_HEADER = "x-pf-session-trust";
export const SESSION_PAYLOAD_HEADER = "x-pf-session";

export function encodeSessionForRequestHeader(session: SessionPayload): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeSessionFromRequestHeader(blob: string): SessionPayload | null {
  try {
    const json = Buffer.from(blob, "base64url").toString("utf8");
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}
