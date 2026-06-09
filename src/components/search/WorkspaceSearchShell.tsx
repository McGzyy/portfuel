"use client";

import type { ReactNode } from "react";
import { WorkspaceGotoHotkeys } from "@/components/dashboard/WorkspaceGotoHotkeys";
import { WorkspaceShortcutsModal } from "@/components/dashboard/WorkspaceShortcutsModal";
import {
  WorkspaceSearchProvider,
  WorkspaceSearchTrigger,
} from "@/components/search/WorkspaceSearch";

export function WorkspaceSearchShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceSearchProvider>
      <WorkspaceGotoHotkeys />
      <WorkspaceShortcutsModal />
      {children}
    </WorkspaceSearchProvider>
  );
}

export function WorkspaceSearchHeaderTrigger() {
  return <WorkspaceSearchTrigger />;
}
