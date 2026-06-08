import Link from "next/link";
import { cn } from "@/lib/utils";

export function TickerPageNav({
  hasCalls,
  isEquity,
}: {
  hasCalls: boolean;
  isEquity: boolean;
}) {
  const links = [
    { href: "#chart", label: "Chart" },
    ...(hasCalls ? [{ href: "#calls", label: "Community calls" }] : []),
    ...(isEquity ? [{ href: "#intel", label: "Market intel" }] : [{ href: "#intel", label: "Reference" }]),
  ];

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Ticker sections"
    >
      {links.map((item) => (
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
