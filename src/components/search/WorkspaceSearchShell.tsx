"use client";

import type { ReactNode } from "react";
import {
  WorkspaceSearchProvider,
  WorkspaceSearchTrigger,
} from "@/components/search/WorkspaceSearch";

export function WorkspaceSearchShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceSearchProvider>
      {children}
    </WorkspaceSearchProvider>
  );
}

export function WorkspaceSearchHeaderTrigger() {
  return <WorkspaceSearchTrigger />;
}
