export const CANCELLATION_FEEDBACK_REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_using_enough", label: "Not using it enough" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "found_alternative", label: "Found another service" },
  { value: "technical_issues", label: "Technical or reliability issues" },
  { value: "temporary_break", label: "Taking a break — may return" },
  { value: "other", label: "Other" },
] as const;

export type CancellationFeedbackReason =
  (typeof CANCELLATION_FEEDBACK_REASONS)[number]["value"];

export type CancellationFeedbackSource = "pre_portal" | "post_portal" | "webhook";

export type CancellationFeedbackRow = {
  id: string;
  user_id: string;
  reason: CancellationFeedbackReason;
  comment: string | null;
  membership_tier: "member" | "pro" | null;
  billing_interval: "monthly" | "annual" | null;
  subscription_status: "pending" | "active" | "cancelled";
  source: CancellationFeedbackSource;
  admin_notified_at: string | null;
  created_at: string;
};

export type CancellationFeedbackWithUser = CancellationFeedbackRow & {
  username: string;
  display_name: string | null;
  email: string | null;
};

export function cancellationReasonLabel(reason: CancellationFeedbackReason): string {
  return (
    CANCELLATION_FEEDBACK_REASONS.find((r) => r.value === reason)?.label ?? reason
  );
}
