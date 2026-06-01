import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Intrinsic size of public/logo.png — update after `npm run brand-assets`. */
const LOGO_SRC_WIDTH = 1474;
const LOGO_SRC_HEIGHT = 316;

const sizes = {
  /** Compact header on narrow phones */
  xs: { width: 132, height: 28, className: "h-7 w-auto max-w-[8.75rem]" },
  /** Sign-in / join hero */
  auth: { width: 200, height: 43, className: "h-10 w-auto max-w-[12.5rem] sm:h-11 sm:max-w-[13.5rem]" },
  sm: { width: 180, height: 39, className: "h-[39px] w-auto" },
  md: { width: 220, height: 47, className: "h-[47px] w-auto" },
  lg: { width: 280, height: 60, className: "h-[60px] w-auto" },
} as const;

export function Logo({
  className,
  href = "/",
  size = "md",
  variant = "default",
  /** Skip Next image optimizer — sharper on auth/marketing when display size ≪ source. */
  unoptimized = false,
}: {
  className?: string;
  href?: string;
  size?: keyof typeof sizes;
  /** Use `light` on dark backgrounds (expects /logo-light.png, falls back to /logo.png). */
  variant?: "default" | "light";
  unoptimized?: boolean;
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
        sizes={`(max-width: 640px) ${size === "xs" ? sizes.xs.width : size === "auth" ? sizes.auth.width : sizes.sm.width}px, ${width}px`}
        quality={100}
        unoptimized={unoptimized}
        className={sizeClass}
        priority
      />
    </Link>
  );
}
