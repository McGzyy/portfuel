import Link from "next/link";
import { Flame, LayoutGrid, MessageCircle, Star } from "lucide-react";

const shortcuts = [
  { href: "/dashboard/feed", label: "Member feed", icon: LayoutGrid },
  { href: "/dashboard/desk", label: "Fueled desk", icon: Flame },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Star },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
] as const;

export function OverviewShortcutBar() {
  return (
    <div className="flex flex-wrap gap-2">
      {shortcuts.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="pf-workspace-chip"
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          {label}
        </Link>
      ))}
    </div>
  );
}
