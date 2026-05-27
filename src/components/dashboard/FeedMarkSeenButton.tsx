"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FEED_SEEN_COOKIE } from "@/lib/feed/last-seen";

const MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function FeedMarkSeenButton({
  variant = "outline",
  label = "Mark all read",
}: {
  variant?: "outline" | "secondary" | "ghost";
  label?: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => {
        document.cookie = `${FEED_SEEN_COOKIE}=${Date.now()};path=/;max-age=${MAX_AGE_SEC};SameSite=Lax`;
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
