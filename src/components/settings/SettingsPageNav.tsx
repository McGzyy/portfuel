import Link from "next/link";

const LINKS = [
  { href: "#billing", label: "Billing" },
  { href: "#email", label: "Email" },
  { href: "#alerts", label: "Alerts" },
  { href: "#referrals", label: "Referrals" },
  { href: "#integrations", label: "Integrations" },
] as const;

export function SettingsPageNav() {
  return (
    <nav
      className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-[var(--pf-border)] bg-[var(--pf-app-bg)]/95 py-2 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Settings sections"
    >
      {LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="pf-pill-inactive shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
