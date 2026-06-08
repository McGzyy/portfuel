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
          className={cn("pf-workspace-chip pf-workspace-chip-square")}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
