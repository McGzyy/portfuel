import { FeedPreviewList } from "@/components/dashboard/FeedPreviewList";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { CallsEmptyState } from "@/components/calls/CallsEmptyState";
import { buildFeedHref } from "@/lib/dashboard/nav";
import type { FollowedMember } from "@/lib/follows/types";

export function FollowingFeedPanel({
  following,
  previews,
  feedHref,
  quoteUpdatedAtBySymbol,
  isPro,
}: {
  following: FollowedMember[];
  previews: CallPreviewData[];
  feedHref?: string;
  quoteUpdatedAtBySymbol?: Record<string, string>;
  isPro?: boolean;
}) {
  if (following.length === 0) {
    return (
      <WorkspacePanel
        title="Following"
        subtitle="Calls from members you track"
        href="/dashboard/rankings"
      >
        <CallsEmptyState
          title="Not following anyone yet"
          description="Follow top callers from rankings or their profile — new theses show here and in your feed."
          showPublishCta={false}
          secondaryHref="/dashboard/rankings"
          secondaryLabel="Browse rankings"
        />
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel
      title="Following"
      subtitle={`${following.length} member${following.length === 1 ? "" : "s"} · latest theses`}
      href={feedHref ?? buildFeedHref({ filter: "following" })}
    >
      {previews.length === 0 ? (
        <CallsEmptyState
          title="No recent calls"
          description="People you follow haven't published lately. Check the full following feed or browse rankings for new ideas."
          showPublishCta={false}
          secondaryHref={feedHref ?? buildFeedHref({ filter: "following" })}
          secondaryLabel="Open following feed"
        />
      ) : (
        <FeedPreviewList
          previews={previews}
          quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
          isPro={isPro}
        />
      )}
    </WorkspacePanel>
  );
}
