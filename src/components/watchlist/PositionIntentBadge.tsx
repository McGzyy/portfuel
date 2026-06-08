import {
  positionIntentShortLabel,
  type PositionIntent,
} from "@/lib/watchlist/position-intent";
import { cn } from "@/lib/utils";

export function PositionIntentBadge({
  intent,
  className,
}: {
  intent: PositionIntent | string | null | undefined;
  className?: string;
}) {
  const value = intent ?? "researching";
  return (
    <span
      className={cn("pf-intent-badge", `pf-intent-${value}`, className)}
      title={positionIntentShortLabel(value)}
    >
      {positionIntentShortLabel(value)}
    </span>
  );
}
