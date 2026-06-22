import { WorkspaceGuide } from "@/components/dashboard/WorkspaceGuide";
import type { SessionPayload } from "@/lib/auth/session-types";
import { shouldAutoShowWorkspaceGuide } from "@/lib/onboarding/workspace-guide";

export async function WorkspaceGuideLoader({
  userId,
  username,
  role,
}: {
  userId: string;
  username: string;
  role: SessionPayload["role"];
}) {
  const autoShow = await shouldAutoShowWorkspaceGuide(userId, role).catch(() => false);
  return <WorkspaceGuide username={username} userId={userId} autoShow={autoShow} />;
}
