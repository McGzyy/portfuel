import Link from "next/link";
import {
  BookOpen,
  Flame,
  LayoutGrid,
  MessageCircle,
  Notebook,
  Star,
  Trophy,
} from "lucide-react";

const shortcuts = [
  { href: "/dashboard/feed", label: "Feed", icon: LayoutGrid },
  { href: "/dashboard/desk", label: "Desk", icon: Flame },
  { href: "/dashboard/book", label: "Book", icon: BookOpen },
  { href: "/dashboard/journal", label: "Journal", icon: Notebook },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Star },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/rankings", label: "Rankings", icon: Trophy },
] as const;

export function OverviewShortcutBar() {
  return (
    <nav
      className="grid grid-cols-4 gap-2 sm:flex sm:gap-2 sm:overflow-x-auto sm:pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
      aria-label="Overview shortcuts"
    >
      {shortcuts.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="pf-workspace-chip justify-center sm:shrink-0 sm:justify-start"
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** @deprecated Use OverviewShortcutBar — rankings merged into shortcut bar. */
export function DashboardQuickNav() {
  return <OverviewShortcutBar />;
}
