import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkspaceSignOutButton({ className }: { className?: string }) {
  return (
    <form action="/api/auth/logout" method="POST" className={cn("w-full", className)}>
      <button type="submit" className="pf-sidebar-footer-link w-full">
        <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        Sign out
      </button>
    </form>
  );
}
