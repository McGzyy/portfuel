"use client";

import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminNavCountsProvider } from "@/components/admin/AdminNavCountsProvider";
import { AdminWorkspaceSidebar } from "@/components/admin/AdminWorkspaceSidebar";
import { ClientErrorBoundary } from "@/components/errors/ClientErrorBoundary";

/** Admin workspace chrome — matches member dashboard shell. */
export function AdminWorkspaceFrame({ children }: { children: React.ReactNode }) {
  return (
    <AdminNavCountsProvider>
      <div className="pf-workspace">
        <div className="pf-workspace-sidebar-wrap">
          <AdminWorkspaceSidebar />
        </div>
        <div className="pf-workspace-main">
          <AdminMobileNav />
          <div className="pf-workspace-content max-w-none">
            <ClientErrorBoundary>{children}</ClientErrorBoundary>
          </div>
        </div>
      </div>
    </AdminNavCountsProvider>
  );
}
