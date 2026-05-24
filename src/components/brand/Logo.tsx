import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { width: 200, height: 34, className: "h-[34px] w-auto" },
  md: { width: 240, height: 41, className: "h-[41px] w-auto" },
  lg: { width: 280, height: 48, className: "h-12 w-auto" },
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
        src="/logo.svg"
        alt="PortFuel.pro"
        width={width}
        height={height}
        className={sizeClass}
        priority
      />
    </Link>
  );
}
