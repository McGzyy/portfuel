import { canAccessProIntelligence, sessionToProContext } from "@/lib/features/pro-intelligence";
import type { SessionPayload } from "@/lib/auth/session";
import type { AnnouncementAudience } from "@/lib/announcements/types";

export function audienceMatches(
  audience: AnnouncementAudience,
  session: SessionPayload
): boolean {
  if (audience === "all") return true;
  const pro = canAccessProIntelligence(sessionToProContext(session));
  if (audience === "pro") return pro;
  return !pro;
}
