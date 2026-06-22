import { WorkspaceLiveBar } from "@/components/dashboard/WorkspaceLiveBar";
import { fetchWorkspacePulse } from "@/lib/workspace/pulse";

/** Compact live pulse strip for workspace pages (server-fetched initial state). */
export async function WorkspaceLivePulse({
  userId,
  isPro,
  feedHref = "/dashboard/feed",
}: {
  userId: string;
  isPro: boolean;
  feedHref?: string;
}) {
  const pulse = await fetchWorkspacePulse(userId, isPro).catch(() => null);
  if (!pulse) return null;
  return <WorkspaceLiveBar initial={pulse} compact feedHref={feedHref} />;
}
