import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_HELP_HREF, SUPPORT_TICKETS_HREF } from "@/lib/help/content";
import { cn } from "@/lib/utils";

export { SUPPORT_EMAIL, SUPPORT_HELP_HREF, SUPPORT_TICKETS_HREF };

const linkClass =
  "font-semibold text-[var(--pf-red)] underline-offset-2 hover:underline";

export function SupportContactLink({
  children = "contact support",
  variant = "ticket",
  className,
}: {
  children?: React.ReactNode;
  variant?: "ticket" | "help" | "email";
  className?: string;
}) {
  if (variant === "email") {
    return (
      <a href={`mailto:${SUPPORT_EMAIL}`} className={cn(linkClass, className)}>
        {children}
      </a>
    );
  }

  const href = variant === "help" ? SUPPORT_HELP_HREF : SUPPORT_TICKETS_HREF;
  return (
    <Link href={href} className={cn(linkClass, className)}>
      {children}
    </Link>
  );
}

/** Renders a plain error string with "contact support" turned into a link. */
export function ErrorMessageWithSupport({
  message,
  supportPhrase = "contact support",
  variant = "ticket",
  className,
}: {
  message: string;
  supportPhrase?: string;
  variant?: "ticket" | "help" | "email";
  className?: string;
}) {
  const idx = message.toLowerCase().indexOf(supportPhrase.toLowerCase());
  if (idx === -1) {
    return <span className={className}>{message}</span>;
  }

  const before = message.slice(0, idx);
  const match = message.slice(idx, idx + supportPhrase.length);
  const after = message.slice(idx + supportPhrase.length);

  return (
    <span className={className}>
      {before}
      <SupportContactLink variant={variant}>{match}</SupportContactLink>
      {after}
    </span>
  );
}
