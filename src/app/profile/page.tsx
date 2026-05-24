import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CallCard } from "@/components/calls/CallCard";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchUserProfile, fetchUserRecentCalls } from "@/lib/users/profile";
import { hasSupabaseConfig } from "@/lib/db/supabase";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let profile = null;
  let recentCalls: Awaited<ReturnType<typeof fetchUserRecentCalls>> = [];
  if (hasSupabaseConfig()) {
    profile = await fetchUserProfile(session.userId);
    recentCalls = await fetchUserRecentCalls(session.userId);
  }

  const headerUser = toHeaderUser(session);

  return (
    <AppShell user={headerUser}>
      <PageHeader
        title="Profile"
        description="Your public member profile and performance snapshot."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Username
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-[var(--pf-black)]">
            @{profile?.username ?? session.username}
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-400)]">Permanent — cannot be changed</p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Display name
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--pf-black)]">
            {profile?.display_name ?? session.displayName ?? "—"}
          </p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Calls
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--pf-black)]">{profile?.calls_count ?? 0}</p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Rank score
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--pf-black)]">
            {profile?.rank_score != null ? Number(profile.rank_score).toFixed(1) : "0"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Win rate
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--pf-black)]">
            {profile?.win_rate != null ? `${profile.win_rate}%` : "—"}
          </p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Avg return
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--pf-black)]">
            {profile?.avg_return_pct != null
              ? `${Number(profile.avg_return_pct) >= 0 ? "+" : ""}${Number(profile.avg_return_pct).toFixed(2)}%`
              : "—"}
          </p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Membership
          </p>
          <p className="mt-1 text-lg font-bold capitalize text-[var(--pf-black)]">
            {profile?.subscription_status ?? session.subscriptionStatus}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Your recent calls</h2>
          <Link href="/calls/new" className="text-sm font-semibold text-[var(--pf-red)] hover:underline">
            New call
          </Link>
        </div>
        {recentCalls.length === 0 ? (
          <p className="rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-border)] bg-white px-6 py-10 text-center text-sm text-[var(--pf-gray-500)]">
            No calls yet. Submit your first thesis from the dashboard.
          </p>
        ) : (
          <ul className="space-y-4">
            {recentCalls.map((c) => (
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
                    is_fueled: c.is_fueled,
                    vote_score: c.vote_score,
                    comment_count: c.comment_count,
                    display_name: profile?.display_name ?? session.displayName,
                    pin: profile?.username ?? session.username,
                    is_trusted: Boolean(profile?.trusted_at),
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
