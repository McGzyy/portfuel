import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Intrinsic size of public/logo.png — update after `npm run brand-assets`. */
const LOGO_SRC_WIDTH = 1474;
const LOGO_SRC_HEIGHT = 316;

const sizes = {
  sm: { width: 180, height: 39, className: "h-[39px] w-auto" },
  md: { width: 220, height: 47, className: "h-[47px] w-auto" },
  lg: { width: 280, height: 60, className: "h-[60px] w-auto" },
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
  const { width, height, className: sizeClass } = sizes[size];
  const src = variant === "light" ? "/logo-light.png" : "/logo.png";

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src={src}
        alt="PortFuel.pro"
        width={LOGO_SRC_WIDTH}
        height={LOGO_SRC_HEIGHT}
        sizes={`(max-width: 640px) ${sizes.sm.width}px, ${width}px`}
        quality={100}
        className={sizeClass}
        priority
      />
    </Link>
  );
}
