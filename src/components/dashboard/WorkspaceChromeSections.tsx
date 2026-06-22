import { Suspense } from "react";
import { MemberNav } from "@/components/dashboard/MemberNav";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import type { SessionPayload } from "@/lib/auth/session-types";
import { loadWorkspaceChromeData } from "@/lib/workspace/chrome-data";

const EMPTY_ACTIVITY = {
  feedNewCount: 0,
  dmUnread: 0,
  notifUnread: 0,
  at: "",
};

export function WorkspaceSidebarFallback({ username }: { username: string }) {
  return (
    <WorkspaceSidebar
      username={username}
      dmUnread={0}
      notifUnread={0}
      feedNewCount={0}
      whatsNewUnread={0}
    />
  );
}

export function MemberNavFallback({
  username,
  displayName,
  isAdmin,
}: {
  username: string;
  displayName: string;
  isAdmin: boolean;
}) {
  return (
    <MemberNav
      username={username}
      displayName={displayName}
      isAdmin={isAdmin}
      dmUnread={0}
      notifUnread={0}
      feedNewCount={0}
      whatsNewUnread={0}
      avatarUrl={null}
    />
  );
}

async function WorkspaceChromeAside({ session }: { session: SessionPayload }) {
  const { headerAccount, activityInitial } = await loadWorkspaceChromeData(session);

  return (
    <WorkspaceSidebar
      username={session.username}
      dmUnread={activityInitial.dmUnread}
      notifUnread={activityInitial.notifUnread}
      feedNewCount={activityInitial.feedNewCount}
      whatsNewUnread={headerAccount.whatsNewUnread}
    />
  );
}

async function WorkspaceChromeNav({ session }: { session: SessionPayload }) {
  const { headerAccount, activityInitial } = await loadWorkspaceChromeData(session);

  return (
    <MemberNav
      username={session.username}
      displayName={session.displayName ?? session.username}
      avatarUrl={headerAccount.avatarUrl}
      isAdmin={session.role === "admin"}
      dmUnread={activityInitial.dmUnread}
      notifUnread={activityInitial.notifUnread}
      feedNewCount={activityInitial.feedNewCount}
      whatsNewUnread={headerAccount.whatsNewUnread}
    />
  );
}

export function WorkspaceSidebarSection({ session }: { session: SessionPayload }) {
  return (
    <Suspense fallback={<WorkspaceSidebarFallback username={session.username} />}>
      <WorkspaceChromeAside session={session} />
    </Suspense>
  );
}

export function MemberNavSection({ session }: { session: SessionPayload }) {
  return (
    <Suspense
      fallback={
        <MemberNavFallback
          username={session.username}
          displayName={session.displayName ?? session.username}
          isAdmin={session.role === "admin"}
        />
      }
    >
      <WorkspaceChromeNav session={session} />
    </Suspense>
  );
}

export { EMPTY_ACTIVITY };
