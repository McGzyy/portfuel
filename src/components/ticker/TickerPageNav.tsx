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
    ...(hasCalls ? [{ href: "#calls", label: "Calls" }] : []),
    ...(isEquity ? [{ href: "#intel", label: "Intel" }] : [{ href: "#intel", label: "Reference" }]),
  ];

  return (
    <nav className="pf-ticker-section-nav" aria-label="Ticker sections">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="pf-pill-inactive shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
