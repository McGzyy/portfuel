import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Trimmed brand mark — aspect ~4.67:1 (737×158 source). */
const sizes = {
  sm: { width: 180, height: 39, className: "h-[39px] w-auto" },
  md: { width: 220, height: 47, className: "h-[47px] w-auto" },
  lg: { width: 280, height: 60, className: "h-[60px] w-auto" },
} as const;

export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string;
  size?: keyof typeof sizes;
}) {
  const { width, height, className: sizeClass } = sizes[size];

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src="/logo.png"
        alt="PortFuel.pro"
        width={width}
        height={height}
        className={sizeClass}
        priority
      />
    </Link>
  );
}
