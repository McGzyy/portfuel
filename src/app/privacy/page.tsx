import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <div className="pf-app-bg flex-1">
        <article className="mx-auto max-w-2xl px-4 py-16">
          <p className="pf-eyebrow">Legal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <div className="pf-card mt-8 p-6 text-[var(--pf-gray-600)]">
            <p className="text-sm leading-relaxed">
              Placeholder — add a full privacy policy before paid launch. PortFuel collects account
              identifiers (PIN), authenticator data, and call content you submit.
            </p>
          </div>
          <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[var(--pf-red)] hover:underline">
            ← Back to home
          </Link>
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
