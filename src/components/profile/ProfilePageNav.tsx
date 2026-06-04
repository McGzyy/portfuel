import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#performance", label: "Performance" },
  { href: "#calls", label: "Your calls" },
  { href: "#membership", label: "Membership" },
  { href: "#sharing", label: "Sharing" },
] as const;

export function ProfilePageNav() {
  return (
    <nav
      className="sticky top-0 z-20 -mx-1 flex gap-2 overflow-x-auto border-b border-[var(--pf-border)] bg-[var(--pf-app-bg)]/95 px-1 py-2 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Profile sections"
    >
      {LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "shrink-0 rounded-full border border-[var(--pf-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)]",
            "hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
