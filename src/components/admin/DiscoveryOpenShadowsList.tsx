import Link from "next/link";
import type { DiscoveryShadowCallRow } from "@/lib/desk-discovery/shadow-calls";
import { formatPct } from "@/lib/utils";

export function DiscoveryOpenShadowsList({
  shadows,
  className,
}: {
  shadows: DiscoveryShadowCallRow[];
  className?: string;
}) {
  if (shadows.length === 0) return null;

  return (
    <ul className={className ?? "mt-3 flex flex-wrap gap-2"}>
      {shadows.map((shadow) => (
        <li key={shadow.id}>
          <Link
            href={
              shadow.candidateId
                ? `/admin?tab=discovery&candidate=${shadow.candidateId}`
                : "/admin?tab=discovery"
            }
            className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-violet-950 transition-colors hover:border-violet-300 hover:bg-white"
          >
            <span className="font-mono">{shadow.symbol}</span>
            <span className="text-violet-700/80">{shadow.direction.toUpperCase()}</span>
            <span className="text-[10px] font-medium text-violet-600/90">
              {shadow.returnPct != null ? formatPct(shadow.returnPct) : "—"}
            </span>
            <span className="text-[10px] text-violet-500">· {shadow.score}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
