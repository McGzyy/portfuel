import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SupportContactLink } from "@/components/help/SupportContactLink";

export default function AccountRestrictedPage() {
  return (
    <AuthShell
      title="Workspace access paused"
      subtitle="Your membership is active, but workspace access is temporarily restricted. Billing and profile settings remain available."
    >
      <div className="space-y-4 text-center text-sm text-[var(--pf-gray-600)]">
        <p>
          You can still manage billing from your profile.{" "}
          <SupportContactLink variant="ticket">Contact support</SupportContactLink> if you need this
          lifted.
        </p>
        <Link
          href="/settings"
          className="inline-flex w-full items-center justify-center rounded-[var(--pf-radius-md)] bg-[var(--pf-red)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pf-red-hover)]"
        >
          Open profile
        </Link>
      </div>
    </AuthShell>
  );
}
