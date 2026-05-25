import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_INTRO,
  TERMS_SECTIONS,
} from "@/content/legal/terms";

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Service"
      effectiveDate={TERMS_EFFECTIVE_DATE}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
    />
  );
}
