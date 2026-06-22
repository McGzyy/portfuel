import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";

export function SettingsCommandHeader({ username }: { username: string }) {
  return (
    <WorkspacePageHeader
      eyebrow="Account"
      title="Settings"
      description="Membership, billing, email, referrals, and integrations — separate from your public track record page."
      footerLink={
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
          <Link
            href="/dashboard"
            className="text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            ← Workspace
          </Link>
          <Link href={`/member/${username}`} className="text-[var(--pf-red)] hover:underline">
            View public profile →
          </Link>
        </div>
      }
    />
  );
}
