import type { SessionPayload } from "@/lib/auth/session";

export type HeaderUser = {
  username: string;
  displayName: string | null;
  role: SessionPayload["role"];
};

export function toHeaderUser(session: SessionPayload): HeaderUser {
  return {
    username: session.username,
    displayName: session.displayName,
    role: session.role,
  };
}
