import Link from "next/link";
import {
  BookOpen,
  Flame,
  LayoutGrid,
  Notebook,
  Star,
  Trophy,
} from "lucide-react";

const shortcuts = [
  { href: "/demo/feed", label: "Feed", icon: LayoutGrid },
  { href: "/demo/desk", label: "Desk", icon: Flame },
  { href: "/join", label: "Book", icon: BookOpen },
  { href: "/join", label: "Journal", icon: Notebook },
  { href: "/join", label: "Watchlist", icon: Star },
  { href: "/demo/rankings", label: "Rankings", icon: Trophy },
] as const;

export function DemoShortcutBar() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Demo overview shortcuts">
      {shortcuts.map(({ href, label, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="pf-workspace-chip basis-[calc(50%-0.25rem)] grow justify-center sm:basis-auto sm:grow-0 sm:justify-start"
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
