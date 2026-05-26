import Link from "next/link";
import { FeedPreviewList } from "@/components/dashboard/FeedPreviewList";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { buildFeedHref } from "@/lib/dashboard/nav";
import type { FollowedMember } from "@/lib/follows/types";

export function FollowingFeedPanel({
  following,
  previews,
}: {
  following: FollowedMember[];
  previews: CallPreviewData[];
}) {
  if (following.length === 0) {
    return (
      <WorkspacePanel
        title="Following"
        subtitle="Calls from members you track"
        href="/rankings"
      >
        <p className="px-3 py-6 text-center text-sm text-[var(--pf-gray-500)]">
          Follow top callers from{" "}
          <Link href="/rankings" className="font-semibold text-[var(--pf-red)] hover:underline">
            rankings
          </Link>{" "}
          or their profile — new theses show here and in your feed.
        </p>
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel
      title="Following"
      subtitle={`${following.length} member${following.length === 1 ? "" : "s"} · latest theses`}
      href={buildFeedHref({ filter: "following" })}
    >
      {previews.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-[var(--pf-gray-500)]">
          No recent calls from people you follow.
        </p>
      ) : (
        <FeedPreviewList previews={previews} />
      )}
    </WorkspacePanel>
  );
}
