import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const links: {
  href: string;
  label: string;
  icon: typeof Trophy;
}[] = [{ href: "/rankings", label: "Rankings", icon: Trophy }];

export function DashboardQuickNav() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Dashboard shortcuts">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white px-3.5 text-xs font-semibold text-[var(--pf-gray-700)] shadow-[var(--pf-shadow-sm)] transition-colors hover:border-[var(--pf-gray-200)] hover:bg-[var(--pf-gray-50)]"
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
