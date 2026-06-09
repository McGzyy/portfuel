import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SupportContactLink } from "@/components/help/SupportContactLink";

export default function AccountBannedPage() {
  return (
    <AuthShell
      title="Account suspended"
      subtitle={
        <>
          This account has been suspended. If you believe this is a mistake,{" "}
          <SupportContactLink variant="email">contact support</SupportContactLink>.
        </>
      }
    >
      <div className="space-y-4 text-center text-sm text-[var(--pf-gray-600)]">
        <p>You cannot sign in or use PortFuel with this account.</p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--pf-gray-50)]"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
