import type { ChartMemberAvatar } from "@/lib/charts/types";

type MemberAvatarSource = {
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

export function toChartMemberAvatar(member: MemberAvatarSource): ChartMemberAvatar {
  return {
    username: member.username,
    displayName: member.display_name ?? null,
    avatarUrl: member.avatar_url ?? null,
  };
}
