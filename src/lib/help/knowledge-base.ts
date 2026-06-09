import { HELP_SECTIONS, SUPPORT_EMAIL, SUPPORT_TICKETS_HREF } from "@/lib/help/content";

/** Compact PortFuel product knowledge for the help assistant system prompt. */
export function buildHelpKnowledgeBase(): string {
  const blocks = HELP_SECTIONS.map((section) => {
    const articles = section.articles
      .map((a) => {
        const bullets = a.bullets?.length ? `\n- ${a.bullets.join("\n- ")}` : "";
        return `### ${a.title}\n${a.body.join("\n")}${bullets}`;
      })
      .join("\n\n");
    const faqs = section.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    return `## ${section.label}\n${section.summary}\n\n${articles}\n\n${faqs}`;
  });

  return [
    "PortFuel is a member workspace for publishing timestamped trading theses (calls), tracking performance, community feed, watchlist, private journal, Pro research tools, rankings, and billing via Stripe.",
    `Support email: ${SUPPORT_EMAIL}. Support tickets: ${SUPPORT_TICKETS_HREF}.`,
    blocks.join("\n\n---\n\n"),
  ].join("\n\n");
}
