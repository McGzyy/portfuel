import Link from "next/link";
import { Plus } from "lucide-react";
import { CallThesisBlock } from "@/components/calls/CallThesisBlock";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import type { AssetClass } from "@/lib/market/validate-symbol";
import type { CallWithUser } from "@/lib/db/supabase";

export type TickerThesisCall = CallWithUser & { live?: boolean };

export function TickerCallsSection({
  symbol,
  assetClass,
  calls,
  session,
  viewerUserId,
  isPro,
  proLocked,
  isAdmin,
}: {
  symbol: string;
  assetClass: AssetClass;
  calls: TickerThesisCall[];
  session: boolean;
  viewerUserId?: string;
  isPro: boolean;
  proLocked: boolean;
  isAdmin: boolean;
}) {
  return (
    <section id="calls" className="scroll-mt-24">
      <div className="mb-6 border-b border-[var(--pf-border)] pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Community
        </p>
        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[var(--pf-black)]">
          Calls on {symbol}
        </h2>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          {calls.length === 0
            ? "No published theses yet — be the first on record for this symbol."
            : `${calls.length} thesis${calls.length === 1 ? "" : "es"} with entry, target, and live return when available.`}
        </p>
      </div>

      {calls.length === 0 ? (
        <div className="pf-workspace-panel px-6 py-14 text-center">
          <p className="font-medium text-[var(--pf-gray-700)]">No calls on this ticker yet</p>
          {session ? (
            <Link
              href={`/calls/new?asset=${assetClass}&symbol=${encodeURIComponent(symbol)}`}
              className="mt-6 inline-block"
            >
              <Button>
                <Plus className="h-4 w-4" />
                Be the first to call {symbol}
              </Button>
            </Link>
          ) : (
            <Link href="/join" className="mt-6 inline-block">
              <Button variant="outline">{COPY.ctaGetAccess}</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {calls.map((c) => (
            <div key={c.id} id={`thesis-${c.id}`} className="scroll-mt-24">
              <CallThesisBlock
                call={{
                  ...c,
                  user_id: c.user_id,
                  asset_class: c.asset_class,
                  symbol: c.symbol,
                  stop_price: c.stop_price,
                  last_price: c.last_price,
                  live: c.live,
                  users: {
                    display_name: c.users.display_name,
                    pin: c.users.username ?? c.users.pin,
                    username: c.users.username,
                    trusted_at: c.users.trusted_at,
                  },
                }}
                interactive={session}
                viewerUserId={viewerUserId}
                isPro={isPro}
                showUpgrade={session ? proLocked : false}
                canGenerateSummary={isPro}
                isAdmin={isAdmin}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
