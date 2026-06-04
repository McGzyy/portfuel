import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CallCard } from "@/components/calls/CallCard";
import { MemberProfileHero } from "@/components/member/MemberProfileHero";
import { MemberReturnChart } from "@/components/charts/MemberReturnChart";
import { MemberTrackRecordStrip } from "@/components/member/MemberTrackRecordStrip";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import { MemberCallsSectionHeader } from "@/components/member/MemberCallsSectionHeader";
import { MemberProfileNav } from "@/components/member/MemberProfileNav";
import { CallsEmptyState } from "@/components/calls/CallsEmptyState";
import { mapCallRowToCardData } from "@/lib/calls/card-display";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { isFollowing } from "@/lib/follows/service";
import { fetchMemberPublicCalls } from "@/lib/users/public-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { SITE_NAME } from "@/lib/seo/site";
import { isDemoMode } from "@/lib/demo/config";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import {
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
    title: `@${handle} · Member profile`,
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

  const { member, calls } = await fetchMemberPublicCalls(username);
  if (!member) notFound();

  const isSelf = session.username.toLowerCase() === member.username.toLowerCase();
  const initialFollowing =
    !isSelf && (await isFollowing(session.userId, member.id));
  const trackRecord = summarizeMemberTrackRecord(calls);
  const returnSeries = buildCumulativeReturnSeries(calls);
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));

  return (
    <AppShell user={toHeaderUser(session)}>
      <WorkspaceBackLink />

      <div className="mt-6 space-y-4">
        <MemberProfileHero
          member={member}
          isSelf={isSelf}
          initialFollowing={initialFollowing}
        />
        <MemberProfileNav />
      </div>

      <section id="performance" className="scroll-mt-24 mt-6 space-y-6">
        <MemberReturnChart points={returnSeries} />
        <MemberTrackRecordStrip record={trackRecord} />
      </section>

      <section id="calls" className="scroll-mt-24 mt-10 space-y-6">
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
                  call={mapCallRowToCardData(c, {
                    display_name: member.display_name,
                    username: member.username,
                    trusted: member.trusted,
                  })}
                  interactive
                  canGenerateSummary={!proLocked}
                  showUpgrade={proLocked}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
