import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CallCard } from "@/components/calls/CallCard";
import { MemberProfileHero } from "@/components/member/MemberProfileHero";
import { ProfileOwnerBar } from "@/components/member/ProfileOwnerBar";
import { MemberReturnChart } from "@/components/charts/MemberReturnChart";
import { MemberTrackRecordStrip } from "@/components/member/MemberTrackRecordStrip";
import { ShareTrackRecordCard } from "@/components/profile/ShareTrackRecordCard";
import { ProfilePerformanceSection } from "@/components/profile/ProfilePerformanceSection";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import { MemberCallsSectionHeader } from "@/components/member/MemberCallsSectionHeader";
import { MemberProfileNav } from "@/components/member/MemberProfileNav";
import { CallsEmptyState } from "@/components/calls/CallsEmptyState";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { isFollowing } from "@/lib/follows/service";
import { fetchMemberPublicCalls } from "@/lib/users/public-profile";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { buildReturnDistribution } from "@/lib/charts/return-distribution";
import { fetchAiCoachUsage } from "@/lib/ai/usage";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { SITE_NAME } from "@/lib/seo/site";
import { isDemoMode } from "@/lib/demo/config";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const handle = username.trim();
  return {
    title: `@${handle} · Track record`,
    description: `Track record, published calls, and rank score for @${handle} on ${SITE_NAME}.`,
  };
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { username } = await params;

  if (!isDemoMode() && !hasSupabaseConfig()) {
    return notFound();
  }

  const isSelf = session.username.toLowerCase() === username.trim().toLowerCase();

  const { member, calls } = isSelf
    ? await (async () => {
        const own = await fetchOwnProfile(session);
        if (!own.member) return { member: null, calls: [] as never[] };
        return { member: own.member, calls: own.calls };
      })()
    : await fetchMemberPublicCalls(username);

  if (!member) notFound();

  const initialFollowing =
    !isSelf && (await isFollowing(session.userId, member.id));
  const trackRecord = summarizeMemberTrackRecord(calls);
  const returnSeries = buildCumulativeReturnSeries(calls);
  const returnBuckets = buildReturnDistribution(calls);
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);
  const aiUsage = isSelf
    ? await fetchAiCoachUsage({
        userId: session.userId,
        membershipTier: session.membershipTier ?? null,
        role: session.role,
        configured: isAiCoachConfigured(),
      })
    : null;

  return (
    <AppShell user={toHeaderUser(session)}>
      <div className="mx-auto max-w-4xl space-y-6">
        <WorkspaceBackLink />

        {isSelf ? <ProfileOwnerBar username={member.username} /> : null}

        <MemberProfileHero
          member={member}
          isSelf={isSelf}
          initialFollowing={initialFollowing}
        />
        <MemberProfileNav isSelf={isSelf} />

        {isSelf && aiUsage ? (
          <ProfilePerformanceSection
            trackRecord={trackRecord}
            returnSeries={returnSeries}
            returnBuckets={returnBuckets}
            proLocked={proLocked}
            proGateCta={proGateCta}
            aiUsage={aiUsage}
          />
        ) : (
          <section id="performance" className="scroll-mt-24 space-y-6">
            <MemberReturnChart points={returnSeries} />
            <MemberTrackRecordStrip record={trackRecord} />
          </section>
        )}

        {isSelf ? (
          <ShareTrackRecordCard
            username={member.username}
            callCount={trackRecord.callCount}
            winRatePct={
              trackRecord.callCount > 0
                ? Math.round((trackRecord.winners / trackRecord.callCount) * 100)
                : null
            }
            avgReturnPct={trackRecord.avgReturnPct}
          />
        ) : null}

        <section id="calls" className="scroll-mt-24 space-y-6">
          <MemberCallsSectionHeader
            username={member.username}
            displayName={member.display_name}
            callCount={calls.length}
            trackRecord={trackRecord}
            isSelf={isSelf}
          />

          {calls.length === 0 ? (
            <CallsEmptyState
              title="No public calls yet"
              description={
                isSelf
                  ? "When you publish, your theses appear here and on the member feed."
                  : `@${member.username} hasn't published a thesis on PortFuel yet.`
              }
              showPublishCta={isSelf}
              secondaryHref="/dashboard/rankings"
              secondaryLabel="Browse rankings"
            />
          ) : (
            <ul className="space-y-4">
              {calls.map((c) => (
                <li key={c.id}>
                  <CallCard
                    call={{
                      ...mapUserCallRowToCard(c, {
                        userId: member.id,
                        username: member.username,
                        displayName: member.display_name,
                      }),
                      is_trusted: member.trusted,
                    }}
                    interactive
                    showThesisCoach={isSelf}
                    canGenerateSummary={!proLocked}
                    showUpgrade={proLocked}
                    isPro={!proLocked}
                    viewerUserId={isSelf ? session.userId : undefined}
                    isAdmin={isSelf && session.role === "admin"}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
