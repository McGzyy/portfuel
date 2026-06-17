"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FEED_SEEN_COOKIE } from "@/lib/feed/last-seen";
import { cn } from "@/lib/utils";

const MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function FeedMarkSeenButton({
  variant = "outline",
  label = "Mark all read",
  className,
}: {
  variant?: "outline" | "secondary" | "ghost";
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={cn(className)}
      onClick={() => {
        document.cookie = `${FEED_SEEN_COOKIE}=${Date.now()};path=/;max-age=${MAX_AGE_SEC};SameSite=Lax`;
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
