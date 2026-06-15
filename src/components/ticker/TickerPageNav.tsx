import Link from "next/link";

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
      className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2"
      aria-label="Ticker sections"
    >
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="pf-pill-inactive rounded-full border px-3.5 py-2 text-center text-xs font-semibold sm:shrink-0 sm:py-1.5"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
