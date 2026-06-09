export type HelpSectionId =
  | "overview"
  | "calls"
  | "research"
  | "billing"
  | "account"
  | "troubleshooting";

export type HelpFaqItem = {
  question: string;
  answer: string;
};

export type HelpSection = {
  id: HelpSectionId;
  label: string;
  mobileLabel: string;
  description: string;
  command: string;
  summary: string;
  articles: {
    title: string;
    body: string[];
    bullets?: string[];
  }[];
  faqs: HelpFaqItem[];
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "overview",
    label: "Getting started",
    mobileLabel: "Start",
    description: "Workspace tour & basics",
    command: "help overview",
    summary:
      "PortFuel is your trading workspace — publish calls, follow the community feed, run research, and build a public track record.",
    articles: [
      {
        title: "Workspace layout",
        body: [
          "Overview is your command center: performance stats, hot symbols, and previews of community activity.",
          "Use the sidebar on desktop or the bottom bar + More menu on mobile to move between Feed, Desk, Watchlist, Journal, and Pro research.",
        ],
        bullets: [
          "Home — stats, checklist, and live tape",
          "Feed — all member calls with filters",
          "Desk — official house theses and model portfolio",
          "Watchlist — symbols, alerts, and ticker lookup",
          "Journal — private research per symbol",
          "Rankings — leaderboard and members to follow",
        ],
      },
      {
        title: "Publish your first call",
        body: [
          "A call is a public thesis with symbol, direction, entry, target, and optional stop. It anchors your track record and appears on your profile and the member feed.",
          "Use Publish call from the sidebar or the + action on Overview. Quotes refresh when you submit so entry reflects live marks.",
        ],
      },
    ],
    faqs: [
      {
        question: "Where is the workspace map?",
        answer:
          "Open Help → Getting started, or use the Map link in the sidebar footer for the quick navigation overlay.",
      },
      {
        question: "Is there a keyboard shortcut for search?",
        answer:
          "Press ⌘K (Mac) or Ctrl+K (Windows) anywhere in the workspace to open quick navigation.",
      },
    ],
  },
  {
    id: "calls",
    label: "Calls & track record",
    mobileLabel: "Calls",
    description: "Publish, close, and performance",
    command: "help calls",
    summary:
      "Calls are timestamped theses tied to live quotes. Wins, peak return, and closed outcomes feed your public track record.",
    articles: [
      {
        title: "Open vs closed calls",
        body: [
          "Open calls stay live on your book until you close them, hit target progress, or age past the open window.",
          "Close a call when your thesis plays out or you want to lock in the outcome — peak return is captured at close.",
        ],
      },
      {
        title: "Feed filters",
        body: [
          "Latest shows chronological community calls. Performing highlights calls with strong live returns. Progress surfaces calls moving toward target.",
          "Filter by symbol or members you follow from the feed toolbar.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why does my call timestamp look wrong?",
        answer:
          "Timestamps display in your local timezone. New calls store UTC at creation; older rows may reflect server time until updated.",
      },
      {
        question: "Can I delete a call?",
        answer:
          "You can delete your own calls from the card menu. Deleted calls are removed from the feed and your profile stats.",
      },
    ],
  },
  {
    id: "research",
    label: "Research tools",
    mobileLabel: "Research",
    description: "Watchlist, journal, Pro hub",
    command: "help research",
    summary:
      "Research spans your private journal, symbol watchlist with alerts, and Pro intelligence (screener, earnings, compare, headlines).",
    articles: [
      {
        title: "Watchlist & alerts",
        body: [
          "Add symbols from ticker pages or watchlist lookup. Configure price-move, earnings, and plan-level alerts in Settings → Notifications.",
          "Journal entries can be linked per symbol for a private research trail.",
        ],
      },
      {
        title: "Pro research hub",
        body: [
          "Pro members unlock the research hub: equity screener, earnings battleboard, multi-ticker compare, and headline scanner.",
          "Desk portfolio updates trigger alerts when house positions change.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why is Pro research locked?",
        answer:
          "Upgrade to Pro from Settings → Plan & billing. Some founding members receive comp access until a set date.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & plans",
    mobileLabel: "Billing",
    description: "Membership, Stripe, vouchers",
    command: "help billing",
    summary:
      "Membership is billed through Stripe. Manage payment method, invoices, and cancellation from Settings → Plan & billing.",
    articles: [
      {
        title: "Manage subscription",
        body: [
          "Open the Stripe customer portal from Settings to update card, switch monthly/annual, or cancel.",
          "Referral credits and voucher codes apply at checkout or in Settings → Sharing & referrals.",
        ],
      },
    ],
    faqs: [
      {
        question: "I was charged but don't have access",
        answer:
          "Return to Settings and use Refresh billing status. If access is still missing after a few minutes, open a support ticket with your receipt email.",
      },
      {
        question: "How do referrals work?",
        answer:
          "Share your invite link from Settings. When referred members subscribe, you earn credits toward your next invoice.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & profile",
    mobileLabel: "Account",
    description: "Profile, alerts, security",
    command: "help account",
    summary:
      "Your public profile shows track record and published calls. Account settings cover email, appearance, Discord, and notification channels.",
    articles: [
      {
        title: "Public profile",
        body: [
          "Your profile URL is portfuel.pro/member/{username}. Display name and avatar appear on calls and rankings.",
          "Social highlight (X/Twitter) can be configured in Settings → Sharing.",
        ],
      },
      {
        title: "Notifications",
        body: [
          "In-app alerts cover votes, comments, watchlist moves, DMs, and desk updates. Email and push are configurable per category in Settings.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I change my username?",
        answer:
          "Usernames are set at signup. Contact support if you need a one-time change for a typo or impersonation concern.",
      },
    ],
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    mobileLabel: "Fix it",
    description: "Common issues & status",
    command: "help troubleshoot",
    summary:
      "Most issues resolve with a refresh, billing sync, or clearing cached session. Escalate to support when data looks persistently wrong.",
    articles: [
      {
        title: "Quick fixes",
        body: [
          "Pull down to refresh on mobile workspace pages. On desktop, hard-refresh the browser.",
          "If quotes or returns look stale, wait 30–60 seconds — live marks refresh on navigation and feed load.",
          "Billing out of sync: Settings → Plan & billing → refresh status after Stripe checkout.",
        ],
        bullets: [
          "Blank chart — check symbol is valid US equity or supported crypto",
          "403 on Pro tools — confirm active Pro subscription",
          "DM blocked — check moderation status on your account",
        ],
      },
    ],
    faqs: [
      {
        question: "The app feels slow on mobile",
        answer:
          "Ensure you're on the latest build. Navigation caches session data; first load after login may take longer.",
      },
      {
        question: "I can't log in",
        answer:
          "Reset password from the login page. If your account is banned or restricted, the status page explains next steps — reply to that notice or open a ticket.",
      },
    ],
  },
];

export function parseHelpSection(raw: string | undefined): HelpSectionId {
  if (
    raw === "calls" ||
    raw === "research" ||
    raw === "billing" ||
    raw === "account" ||
    raw === "troubleshooting"
  ) {
    return raw;
  }
  return "overview";
}

export function helpSectionHref(section: HelpSectionId, view?: "tickets"): string {
  const params = new URLSearchParams();
  if (section !== "overview") params.set("section", section);
  if (view === "tickets") params.set("view", "tickets");
  const qs = params.toString();
  return qs ? `/dashboard/help?${qs}` : "/dashboard/help";
}

export function getHelpSection(id: HelpSectionId): HelpSection {
  return HELP_SECTIONS.find((s) => s.id === id) ?? HELP_SECTIONS[0];
}

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@portfuel.pro";

export const SUPPORT_HELP_HREF = "/dashboard/help";
export const SUPPORT_TICKETS_HREF = "/dashboard/help?view=tickets";
