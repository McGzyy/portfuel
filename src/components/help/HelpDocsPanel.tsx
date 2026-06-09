"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Map, Mail } from "lucide-react";
import { WORKSPACE_GUIDE_OPEN_EVENT } from "@/lib/onboarding/workspace-guide";
import {
  buildFaqTicketHref,
  getHelpSection,
  helpSectionHref,
  SUPPORT_EMAIL,
  type HelpSectionId,
} from "@/lib/help/content";
import { helpContentSlug } from "@/lib/help/search";
import { cn } from "@/lib/utils";

function FaqItem({
  id,
  question,
  answer,
  sectionId,
}: {
  id: string;
  question: string;
  answer: string;
  sectionId: HelpSectionId;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div id={id} className="scroll-mt-24 border-b border-[var(--pf-border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-[var(--foreground)]">{question}</span>
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-gray-400)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="pb-3.5">
          <p className="text-sm leading-relaxed text-[var(--pf-gray-600)]">{answer}</p>
          <Link
            href={buildFaqTicketHref(sectionId, question)}
            className="mt-3 inline-flex text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Still stuck? Open a support ticket
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function HelpDocsPanel({ sectionId }: { sectionId: HelpSectionId }) {
  const section = getHelpSection(sectionId);

  return (
    <div className="space-y-4">
      <section className="pf-help-command-bar pf-workspace-panel overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pf-border)] px-4 py-3 font-mono text-xs">
          <span className="text-[var(--pf-gray-500)]">
            <span className="text-[var(--pf-red)]">pf</span>
            <span className="text-[var(--pf-gray-400)]"> › </span>
            help
            <span className="text-[var(--pf-gray-400)]"> › </span>
            {section.id}
          </span>
          <span className="rounded border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--pf-gray-500)]">
            docs v1
          </span>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-sm leading-relaxed text-[var(--pf-gray-600)]">{section.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(WORKSPACE_GUIDE_OPEN_EVENT))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2 text-xs font-semibold text-[var(--pf-gray-700)] transition-colors hover:border-[var(--pf-gray-300)]"
            >
              <Map className="h-3.5 w-3.5" />
              Workspace map
            </button>
            <Link
              href={helpSectionHref(sectionId, "tickets")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pf-black)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--pf-gray-800)]"
            >
              Open support ticket
            </Link>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] px-3 py-2 text-xs font-semibold text-[var(--pf-gray-600)] transition-colors hover:border-[var(--pf-gray-300)]"
            >
              <Mail className="h-3.5 w-3.5" />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </section>

      {section.articles.map((article) => (
        <section
          key={article.title}
          id={helpContentSlug(article.title)}
          className="scroll-mt-24 pf-workspace-panel p-5 sm:p-6"
        >
          <h3 className="text-base font-bold text-[var(--foreground)]">{article.title}</h3>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--pf-gray-600)]">
            {article.body.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
            {article.bullets ? (
              <ul className="list-disc space-y-1.5 pl-5">
                {article.bullets.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}

      {section.faqs.length > 0 ? (
        <section className="pf-workspace-panel px-5 py-2 sm:px-6">
          <h3 className="py-3 text-sm font-bold uppercase tracking-wide text-[var(--pf-gray-400)]">
            FAQ
          </h3>
          {section.faqs.map((faq) => (
            <FaqItem
              key={faq.question}
              id={`faq-${helpContentSlug(faq.question)}`}
              question={faq.question}
              answer={faq.answer}
              sectionId={sectionId}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
