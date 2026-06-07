"use client";

import { FollowMemberButton } from "@/components/member/FollowMemberButton";

export function RankingsFollowCell({
  memberId,
  memberUsername,
  initialFollowing,
  isSelf,
}: {
  memberId: string;
  memberUsername: string | null;
  initialFollowing: boolean;
  isSelf: boolean;
}) {
  if (isSelf || !memberUsername) return <span className="text-[var(--pf-gray-300)]">—</span>;

  return (
    <FollowMemberButton
      memberId={memberId}
      memberUsername={memberUsername}
      initialFollowing={initialFollowing}
      compact
    />
  );
}
