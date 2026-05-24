import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      <Image src="/logo.svg" alt="PortFuel.pro" width={180} height={32} priority />
    </Link>
  );
}
