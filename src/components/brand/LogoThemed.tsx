"use client";

import { Logo } from "@/components/brand/Logo";
import { useIsDarkMode } from "@/components/appearance/AppearanceProvider";

export function LogoThemed({
  className,
  href,
  size = "md",
  unoptimized = false,
}: {
  className?: string;
  href?: string;
  size?: "xs" | "auth" | "sm" | "md" | "lg";
  unoptimized?: boolean;
}) {
  const isDark = useIsDarkMode();
  return (
    <Logo
      className={className}
      href={href}
      size={size}
      variant={isDark ? "light" : "default"}
      unoptimized={unoptimized}
    />
  );
}
