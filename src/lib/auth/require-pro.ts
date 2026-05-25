import { getSession, type SessionPayload } from "@/lib/auth/session";
import { canAccessProIntelligence, sessionToProContext } from "@/lib/features/pro-intelligence";

export async function requireProSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
  if (!canAccessProIntelligence(sessionToProContext(session))) {
    throw new Error("pro_required");
  }
  return session;
}
