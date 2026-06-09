import {
  HELP_SECTIONS,
  helpSectionHref,
  type HelpSectionId,
} from "@/lib/help/content";

export type HelpSearchHit = {
  title: string;
  snippet: string;
  sectionId: HelpSectionId;
  sectionLabel: string;
  href: string;
  kind: "article" | "faq" | "summary";
};

export function helpContentSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildIndex(): HelpSearchHit[] {
  const hits: HelpSearchHit[] = [];

  for (const section of HELP_SECTIONS) {
    hits.push({
      title: section.label,
      snippet: section.summary,
      sectionId: section.id,
      sectionLabel: section.label,
      href: helpSectionHref(section.id),
      kind: "summary",
    });

    for (const article of section.articles) {
      hits.push({
        title: article.title,
        snippet: article.body.join(" "),
        sectionId: section.id,
        sectionLabel: section.label,
        href: `${helpSectionHref(section.id)}#${helpContentSlug(article.title)}`,
        kind: "article",
      });
    }

    for (const faq of section.faqs) {
      hits.push({
        title: faq.question,
        snippet: faq.answer,
        sectionId: section.id,
        sectionLabel: section.label,
        href: `${helpSectionHref(section.id)}#faq-${helpContentSlug(faq.question)}`,
        kind: "faq",
      });
    }
  }

  return hits;
}

const HELP_INDEX = buildIndex();

function scoreHit(hit: HelpSearchHit, q: string): number {
  const title = hit.title.toLowerCase();
  const snippet = hit.snippet.toLowerCase();
  const section = hit.sectionLabel.toLowerCase();
  let score = 0;
  if (title === q) score = 100;
  else if (title.startsWith(q)) score = 80;
  else if (title.includes(q)) score = 65;
  else if (section.includes(q)) score = 45;
  else if (snippet.includes(q)) score = 40;
  return score;
}

export function searchHelpDocs(query: string, limit = 12): HelpSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  return HELP_INDEX.map((hit) => ({ hit, score: scoreHit(hit, q) }))
    .filter((row) => row.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.hit.sectionLabel.localeCompare(b.hit.sectionLabel) ||
        a.hit.title.localeCompare(b.hit.title)
    )
    .slice(0, limit)
    .map((row) => row.hit);
}

export function helpSearchResultToPage(hit: HelpSearchHit): {
  label: string;
  description: string;
  href: string;
} {
  const kindLabel =
    hit.kind === "faq" ? "FAQ" : hit.kind === "article" ? "Article" : "Guide";
  return {
    label: hit.title,
    description: `${kindLabel} · ${hit.sectionLabel}`,
    href: hit.href,
  };
}
