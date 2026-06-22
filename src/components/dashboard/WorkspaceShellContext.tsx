"use client";

import { createContext, useContext, type ReactNode } from "react";

const WorkspaceShellContext = createContext(false);

export function WorkspaceShellProvider({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShellContext.Provider value={true}>{children}</WorkspaceShellContext.Provider>
  );
}

export function useInWorkspaceShell(): boolean {
  return useContext(WorkspaceShellContext);
}
