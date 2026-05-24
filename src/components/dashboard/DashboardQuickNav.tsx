import Link from "next/link";
import { BarChart3, LineChart, Plus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const links: {
  href: string;
  label: string;
  icon: typeof Plus;
  primary?: boolean;
}[] = [
  { href: "/calls/new", label: "New call", icon: Plus, primary: true },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/ticker/NVDA", label: "Ticker intel", icon: LineChart },
  { href: "/ticker/BTC", label: "Crypto desk", icon: BarChart3 },
];

export function DashboardQuickNav() {
  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Dashboard shortcuts"
    >
      {links.map(({ href, label, icon: Icon, primary }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-[var(--pf-radius)] border px-3.5 text-xs font-semibold shadow-[var(--pf-shadow-sm)] transition-colors",
            primary
              ? "border-[var(--pf-red)] bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]"
              : "border-[var(--pf-border)] bg-white text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-200)] hover:bg-[var(--pf-gray-50)]"
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
