import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CallCard } from "@/components/calls/CallCard";
import { MemberProfileHero } from "@/components/member/MemberProfileHero";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchMemberPublicCalls } from "@/lib/users/public-profile";
import { isDemoMode } from "@/lib/demo/config";
import { hasSupabaseConfig } from "@/lib/db/supabase";

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

  return (
    <AppShell user={toHeaderUser(session)}>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
      >
        ← Dashboard
      </Link>

      <div className="mt-6">
        <MemberProfileHero member={member} isSelf={isSelf} />
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="pf-eyebrow">Track record</p>
            <h2 className="text-lg font-bold tracking-tight">Published calls</h2>
          </div>
          {isSelf ? (
            <Link
              href="/calls/new"
              className="text-sm font-semibold text-[var(--pf-red)] hover:underline"
            >
              New call →
            </Link>
          ) : null}
        </div>

        {calls.length === 0 ? (
          <p className="pf-empty mt-6">No public calls from this member yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
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
