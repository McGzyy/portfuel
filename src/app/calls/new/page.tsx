import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchWeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { isProIntelligenceLocked, sessionToProContext } from "@/lib/features/pro-intelligence";
import { redirect } from "next/navigation";
import { NewCallForm } from "./NewCallForm";

export default async function NewCallPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const weeklyQuota = await fetchWeeklyQuotaStatus(
    session.userId,
    session.membershipTier ?? null
  );
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));

  return (
    <NewCallForm
      user={toHeaderUser(session)}
      weeklyQuota={weeklyQuota}
      showUpgrade={proLocked}
      isPro={!proLocked}
      isAdmin={session.role === "admin"}
      canPublishCalls={session.canPublishCalls}
      role={session.role}
      canDm={session.canDm}
      canComment={session.canComment}
    />
  );
}
