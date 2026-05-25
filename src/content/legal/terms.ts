import type { LegalSection } from "@/components/legal/LegalDocument";

export const TERMS_EFFECTIVE_DATE = "May 24, 2026";

export const TERMS_INTRO =
  "These Terms of Service (“Terms”) govern your access to PortFuel.pro (“PortFuel,” “we,” “us”). By creating an account, subscribing, or using the service, you agree to these Terms. If you do not agree, do not use PortFuel.";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. What PortFuel is",
    paragraphs: [
      "PortFuel is a membership community platform where members publish stock and crypto trade ideas (“calls”), view market data integrations, and interact through comments and votes.",
      "PortFuel does not execute trades, hold funds, or provide personalized investment advice. Content on the platform reflects member opinions, not recommendations from PortFuel.",
    ],
  },
  {
    title: "2. Eligibility and accounts",
    paragraphs: [
      "You must be at least 18 years old and able to enter a binding contract. You are responsible for keeping your password and two-factor authentication device secure.",
      "Usernames are permanent after registration. You agree that information you provide at signup is accurate and that you will not impersonate others or create duplicate accounts to evade limits or bans.",
    ],
  },
  {
    title: "3. Subscriptions and billing",
    paragraphs: [
      "Paid access is offered on recurring monthly plans (Member and Pro Intelligence) processed by Stripe. Prices shown at checkout are authoritative; promotional codes may apply when offered.",
      "Subscriptions renew automatically until cancelled through the billing portal or Stripe. You may cancel at any time; access typically continues through the end of the paid period unless otherwise stated by Stripe or applicable law.",
      "Refunds are handled according to our refund policy at checkout and Stripe’s rules. Chargebacks without contacting support first may result in account suspension.",
    ],
    list: [
      "Member tier: full workspace, charts, rankings, and community features except Pro-only intelligence modules.",
      "Pro Intelligence tier: everything in Member plus Pro market intel and related analytics gates.",
    ],
  },
  {
    title: "4. Acceptable use",
    paragraphs: [
      "You may not scrape, reverse engineer, or overload the service; post unlawful, harassing, or misleading content; manipulate votes or rankings; or share login credentials.",
      "We may remove content, throttle submissions, or suspend accounts that violate these Terms or harm the community. Admins may moderate calls, comments, and membership status.",
    ],
  },
  {
    title: "5. Your content and license",
    paragraphs: [
      "You retain ownership of theses and comments you submit. You grant PortFuel a non-exclusive, worldwide license to host, display, and distribute that content on the platform (including public teasers and leaderboards as configured).",
      "You represent that you have the right to post your content and that it does not infringe third-party rights.",
    ],
  },
  {
    title: "6. Market data and disclaimers",
    paragraphs: [
      "Quotes, charts, news, filings, and other market data may be delayed, incomplete, or incorrect. PortFuel is not responsible for decisions you make based on platform data or member calls.",
      "Trading securities and digital assets involves substantial risk of loss. Past performance of any member or call is not indicative of future results.",
    ],
  },
  {
    title: "7. Privacy",
    paragraphs: [
      "Our Privacy Policy explains how we collect and use account, security, billing, and usage data. By using PortFuel you also agree to that policy.",
    ],
  },
  {
    title: "8. Service changes and termination",
    paragraphs: [
      "We may modify features, pricing, or these Terms with notice when practicable. Continued use after changes constitutes acceptance of updated Terms.",
      "You may stop using PortFuel by cancelling your subscription and ceasing login. We may terminate or suspend access for breach, non-payment, or operational reasons.",
    ],
  },
  {
    title: "9. Limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by law, PortFuel and its operators are not liable for indirect, incidental, special, or consequential damages, or for lost profits or trading losses arising from use of the service.",
      "Our aggregate liability for any claim relating to the service is limited to the greater of (a) amounts you paid us in the twelve months before the claim or (b) one hundred U.S. dollars.",
    ],
  },
  {
    title: "10. Contact",
    paragraphs: [
      "Questions about these Terms or billing: contact support through the email or channel listed on portfuel.pro (update before launch if you use a dedicated support address).",
    ],
  },
];
