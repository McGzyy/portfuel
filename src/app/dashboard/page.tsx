import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { CallCard } from "@/components/calls/CallCard";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
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
    pin: c.users.pin,
    is_trusted: Boolean(c.users.trusted_at),
  }));

  return (
    <>
      <SiteHeader userPin={session.pin} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-[var(--pf-gray-500)]">Track the squad&apos;s latest and top calls.</p>
          </div>
          <Link
            href="/calls/new"
            className="inline-flex h-10 items-center rounded-lg bg-[var(--pf-red)] px-4 text-sm font-medium text-white hover:bg-[#c41820]"
          >
            + New call
          </Link>
        </div>

        <div className="mt-6 flex gap-2 border-b border-[var(--pf-border)]">
          <TabLink href="/dashboard" active={mode === "latest"}>
            Latest
          </TabLink>
          <TabLink href="/dashboard?tab=performing" active={mode === "performing"}>
            Performing
          </TabLink>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {mapped.length === 0 ? (
            <p className="col-span-2 rounded-xl border border-dashed border-[var(--pf-border)] py-16 text-center text-[var(--pf-gray-500)]">
              No calls yet.{" "}
              <Link href="/calls/new" className="text-[var(--pf-red)] hover:underline">
                Submit the first one
              </Link>
            </p>
          ) : (
            mapped.map((call) => <CallCard key={call.id} call={call} />)
          )}
        </div>
      </main>
    </>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-[var(--pf-red)] text-[var(--pf-red)]"
          : "border-transparent text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
      }`}
    >
      {children}
    </Link>
  );
}
