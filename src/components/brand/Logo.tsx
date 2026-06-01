import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Source file intrinsic size (public/logo.png) — keep in sync with scripts/build-header-logo.mjs */
const SRC_WIDTH = 1200;
const SRC_HEIGHT = 299;

const sizes = {
  sm: {
    displayWidth: 156,
    className: "h-[34px] w-[156px] sm:h-[38px] sm:w-[175px]",
  },
  md: {
    displayWidth: 175,
    className: "h-[38px] w-[175px] sm:h-[43px] sm:w-[200px]",
  },
  lg: {
    displayWidth: 220,
    className: "h-[43px] w-[200px] sm:h-[52px] sm:w-[240px]",
  },
} as const;

export function Logo({
  className,
  href = "/",
  size = "md",
  variant = "default",
}: {
  className?: string;
  href?: string;
  size?: keyof typeof sizes;
  /** Use `light` on dark backgrounds (expects /logo-light.png, falls back to /logo.png). */
  variant?: "default" | "light";
}) {
  const { displayWidth, className: sizeClass } = sizes[size];
  const src = variant === "light" ? "/logo-light.png" : "/logo.png";

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src={src}
        alt="PortFuel.pro"
        width={SRC_WIDTH}
        height={SRC_HEIGHT}
        sizes={`${displayWidth}px`}
        quality={100}
        priority
        className={cn(sizeClass, "object-contain object-left")}
      />
    </Link>
  );
}
