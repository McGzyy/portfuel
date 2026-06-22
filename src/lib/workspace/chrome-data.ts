import { cache } from "react";
import type { SessionPayload } from "@/lib/auth/session-types";
import { loadWorkspaceHeaderAccount } from "@/lib/workspace/header-account";
import { loadWorkspaceActivitySnapshot } from "@/lib/workspace/activity-snapshot";

/** One per-request fetch for sidebar + mobile nav badge data. */
export const loadWorkspaceChromeData = cache(async (session: SessionPayload) => {
  const [headerAccount, activityInitial] = await Promise.all([
    loadWorkspaceHeaderAccount(session),
    loadWorkspaceActivitySnapshot(session.userId),
  ]);
  return { headerAccount, activityInitial };
});
