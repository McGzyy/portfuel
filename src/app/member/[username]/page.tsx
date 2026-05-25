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
import {
  WorkspacePageHeader,
  WorkspaceHeaderAction,
} from "@/components/dashboard/WorkspacePageHeader";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { isFollowing } from "@/lib/follows/service";
import { fetchMemberPublicCalls } from "@/lib/users/public-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { SITE_NAME } from "@/lib/seo/site";
import { isDemoMode } from "@/lib/demo/config";
import { hasSupabaseConfig } from "@/lib/db/supabase";

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

  return (
    <AppShell user={toHeaderUser(session)}>
      <WorkspaceBackLink />

      <div className="mt-6">
        <MemberProfileHero
          member={member}
          isSelf={isSelf}
          initialFollowing={initialFollowing}
        />
      </div>

      <div className="mt-6">
        <MemberReturnChart points={returnSeries} />
      </div>

      <div className="mt-6">
        <MemberTrackRecordStrip record={trackRecord} />
      </div>

      <section className="mt-10">
        <WorkspacePageHeader
          eyebrow="Published theses"
          title="Call history"
          description={
            isSelf
              ? "Your public track record — members see every thesis you've published."
              : `Every thesis @${member.username} has published on PortFuel.`
          }
          action={
            isSelf ? <WorkspaceHeaderAction href="/calls/new" label="New call" /> : undefined
          }
          className="mb-6"
        />

        {calls.length === 0 ? (
          <div className="pf-workspace-panel px-6 py-14 text-center text-sm text-[var(--pf-gray-500)]">
            No public calls from this member yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {calls.map((c) => (
              <li key={c.id}>
                <CallCard
                  call={{
                    id: c.id,
                    symbol: c.symbol,
                    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
                    direction: c.direction,
                    thesis: c.thesis,
                    called_at: c.called_at,
                    return_pct: c.return_pct,
                    target_progress: c.target_progress,
                    entry_price: c.entry_price,
                    target_price: c.target_price,
                    stop_price: c.stop_price,
                    last_price: c.last_price,
                    timeframe_tag: c.timeframe_tag,
                    is_fueled: c.is_fueled,
                    vote_score: c.vote_score,
                    comment_count: c.comment_count,
                    display_name: member.display_name,
                    pin: member.username,
                    username: member.username,
                    is_trusted: member.trusted,
                  }}
                  interactive
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
