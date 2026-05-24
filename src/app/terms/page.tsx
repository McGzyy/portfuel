import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <div className="pf-app-bg flex-1">
        <article className="mx-auto max-w-2xl px-4 py-16">
          <p className="pf-eyebrow">Legal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Terms of Service</h1>
          <div className="pf-card mt-8 p-6 text-[var(--pf-gray-600)]">
            <p className="text-sm leading-relaxed">
              Placeholder — add terms before paid launch. PortFuel is not investment advice. Trading
              involves substantial risk of loss.
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
