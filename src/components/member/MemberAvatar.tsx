import Link from "next/link";
import { cn } from "@/lib/utils";

function memberInitials(displayName: string | null | undefined, username: string): string {
  const source = (displayName?.trim() || username).replace(/^@/, "");
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function avatarHue(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash + username.charCodeAt(i) * (i + 1)) % 360;
  }
  return hash;
}

const SIZES = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-9 w-9 text-[11px]",
  lg: "h-11 w-11 text-xs",
} as const;

export function MemberAvatar({
  displayName,
  username,
  size = "md",
  href,
  className,
  title,
}: {
  displayName?: string | null;
  username: string;
  size?: keyof typeof SIZES;
  href?: string;
  className?: string;
  title?: string;
}) {
  const initials = memberInitials(displayName, username);
  const hue = avatarHue(username);
  const label = title ?? (displayName?.trim() || `@${username}`);

  const avatar = (
    <span
      className={cn(
        "pf-member-avatar inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight text-white ring-2 ring-[var(--pf-surface)]",
        SIZES[size],
        className
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 52% 46%) 0%, hsl(${hue} 48% 34%) 100%)`,
      }}
      title={label}
      aria-hidden={href ? true : undefined}
    >
      {initials}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pf-red)]" aria-label={label}>
        {avatar}
      </Link>
    );
  }

  return avatar;
}
