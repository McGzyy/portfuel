import Link from "next/link";
import { Flame, LayoutGrid, Plus, Star } from "lucide-react";

const shortcuts = [
  { href: "/calls/new", label: "New call", icon: Plus, accent: true },
  { href: "/dashboard/feed", label: "Member feed", icon: LayoutGrid },
  { href: "/dashboard/desk", label: "Fueled desk", icon: Flame },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Star },
] as const;

export function OverviewShortcutBar() {
  return (
    <div className="flex flex-wrap gap-2">
      {shortcuts.map(({ href, label, icon: Icon, ...rest }) => (
        <Link
          key={href}
          href={href}
          className={
            "accent" in rest && rest.accent
              ? "inline-flex items-center gap-2 rounded-full bg-[var(--pf-red)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)]"
              : "inline-flex items-center gap-2 rounded-full border border-[var(--pf-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--pf-gray-700)] shadow-[var(--pf-shadow-sm)] transition-colors hover:border-[var(--pf-gray-300)] hover:text-[var(--pf-black)]"
          }
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          {label}
        </Link>
      ))}
    </div>
  );
}
