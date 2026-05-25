import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  list?: string[];
};

export function LegalDocument({
  eyebrow,
  title,
  effectiveDate,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <div className="pf-app-bg flex-1">
        <article className="mx-auto max-w-2xl px-4 py-16">
          <p className="pf-eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-[var(--pf-gray-500)]">Effective {effectiveDate}</p>
          <p className="mt-6 text-sm leading-relaxed text-[var(--pf-gray-600)]">{intro}</p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="pf-card p-6">
                <h2 className="text-lg font-bold tracking-tight text-[var(--pf-black)]">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--pf-gray-600)]">
                  {section.paragraphs.map((p) => (
                    <p key={p.slice(0, 48)}>{p}</p>
                  ))}
                  {section.list ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.list.map((item) => (
                        <li key={item.slice(0, 48)}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-10 text-xs leading-relaxed text-[var(--pf-gray-500)]">
            This document is provided for operational clarity and is not legal advice. Consult
            qualified counsel before relying on it for compliance in your jurisdiction.
          </p>

          <Link
            href="/"
            className="mt-8 inline-block text-sm font-semibold text-[var(--pf-red)] hover:underline"
          >
            ← Back to home
          </Link>
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
