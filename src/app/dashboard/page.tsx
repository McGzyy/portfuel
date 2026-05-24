import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TabNav } from "@/components/layout/TabNav";
import { CallCard } from "@/components/calls/CallCard";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchCallsFeed } from "@/lib/calls/service";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tab } = await searchParams;
  const mode = tab === "performing" ? "performing" : "latest";

  let calls: Awaited<ReturnType<typeof fetchCallsFeed>> = [];
  if (hasSupabaseConfig()) {
    try {
      calls = await fetchCallsFeed(mode);
    } catch (e) {
      console.error("[dashboard]", e);
    }
  }

  const mapped = calls.map((c) => ({
    id: c.id,
    symbol: c.symbol,
    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    target_progress: c.target_progress,
    is_fueled: c.is_fueled,
    vote_score: c.vote_score,
    comment_count: c.comment_count,
    display_name: c.users.display_name,
    pin: c.users.username ?? c.users.pin,
    is_trusted: Boolean(c.users.trusted_at),
  }));

  return (
    <AppShell user={toHeaderUser(session)}>
      <PageHeader
        title="Dashboard"
        description={
          mode === "performing"
            ? "Top movers from members in the last 30 days."
            : "Fresh calls as they hit the board."
        }
        action={
          <Link href="/calls/new">
            <Button size="lg">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New call
            </Button>
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Username
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-[var(--pf-black)]">@{session.username}</p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Feed
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--pf-black)]">
            {mode === "performing" ? "Performing" : "Latest"}
          </p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Calls shown
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--pf-black)]">{mapped.length}</p>
        </div>
      </div>

      <div className="mt-6">
        <TabNav
          tabs={[
            { href: "/dashboard", label: "Latest", active: mode === "latest" },
            {
              href: "/dashboard?tab=performing",
              label: "Performing",
              active: mode === "performing",
            },
          ]}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {mapped.length === 0 ? (
          <div className="pf-empty col-span-2">
            <p className="font-medium text-[var(--pf-gray-700)]">No calls in this feed yet</p>
            <p className="mt-1 text-sm">
              Be the first to share a thesis — members see it here and on the ticker page.
            </p>
            <Link href="/calls/new" className="mt-4 inline-block">
              <Button>Submit a call</Button>
            </Link>
          </div>
        ) : (
          mapped.map((call) => (
            <CallCard key={call.id} call={call} interactive />
          ))
        )}
      </div>
    </AppShell>
  );
}
