import { SiteHeader } from "@/components/brand/SiteHeader";
import { DemoWorkspaceBannerClient } from "@/components/demo/DemoWorkspaceBannerClient";
import { DemoWorkspaceBottomNav } from "@/components/demo/DemoWorkspaceBottomNav";
import { DemoWorkspaceSidebar } from "@/components/demo/DemoWorkspaceSidebar";
import { WorkspaceContent } from "@/components/dashboard/WorkspaceContent";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { getDemoPreviewTier } from "@/lib/demo/tier";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata = {
  title: `Workspace preview · ${SITE_NAME}`,
  description:
    "Explore the PortFuel member workspace — feed, Fueled desk, and rankings — before you join.",
};

export default async function DemoWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const tier = await getDemoPreviewTier();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        user={session ? toHeaderUser(session) : undefined}
        headerMode="workspace"
        logoHref="/demo"
      />
      <DemoWorkspaceBannerClient signedIn={Boolean(session)} tier={tier} />
      <div className="pf-workspace-shell flex-1">
        <div className="pf-workspace mx-auto max-w-6xl">
          <div className="pf-workspace-sidebar-wrap">
            <DemoWorkspaceSidebar />
          </div>
          <div className="pf-workspace-main">
            <WorkspaceContent>{children}</WorkspaceContent>
          </div>
        </div>
      </div>
      <DemoWorkspaceBottomNav />
    </div>
  );
}
