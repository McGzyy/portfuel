import type { CallCardData } from "@/components/calls/CallCard";
import { pendingEntryExpiryLabel } from "@/lib/calls/pending-entry-display";
import { formatPrice, timeAgo } from "@/lib/utils";

/** Secondary context for overview open-call rows — one quiet line. */
export function buildOpenCallOverviewMeta(call: CallCardData): string {
  if (call.call_state === "pending_entry") {
    const parts = [`Called ${timeAgo(call.called_at)}`];
    if (call.trigger_entry_price != null) {
      parts.push(`Trigger $${formatPrice(call.trigger_entry_price)}`);
    }
    const expiry = pendingEntryExpiryLabel(call.expires_at);
    if (expiry) parts.push(expiry);
    return parts.join(" · ");
  }

  const parts = [`Called ${timeAgo(call.called_at)}`];
  const entry = call.entry_price ?? call.price_at_call;

  if (entry != null && call.target_price != null) {
    parts.push(`$${formatPrice(entry)} → $${formatPrice(call.target_price)} target`);
  } else if (entry != null) {
    parts.push(`Entry $${formatPrice(entry)}`);
  }

  if (call.stop_price != null) {
    parts.push(`Stop $${formatPrice(call.stop_price)}`);
  }

  if (call.last_price != null && !call.closed_at) {
    parts.push(`Mark $${formatPrice(call.last_price)}`);
  }

  return parts.join(" · ");
}
