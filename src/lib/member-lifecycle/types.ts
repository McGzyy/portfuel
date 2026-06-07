export type ModerationPreset = "read_only" | "no_calls" | "no_dm" | "full_lock" | "clear";

export type ModerationFlags = {
  canAccessWorkspace: boolean;
  canPublishCalls: boolean;
  canDm: boolean;
  canComment: boolean;
};

export type UserLifecycleRow = {
  id: string;
  role: "member" | "admin";
  username: string;
  display_name: string | null;
  email: string | null;
  email_verified_at: string | null;
  stripe_checkout_email: string | null;
  notify_email: string | null;
  subscription_status: "pending" | "active" | "cancelled";
  membership_tier: "member" | "pro" | null;
  billing_interval: "monthly" | "annual" | null;
  pro_granted_until: string | null;
  comp_access_until: string | null;
  banned_at: string | null;
  last_active_at: string | null;
  moderation_expires_at: string | null;
  can_access_workspace: boolean;
  can_publish_calls: boolean;
  can_dm: boolean;
  can_comment: boolean;
  marketing_member_opt_in: boolean;
  marketing_pro_opt_in: boolean;
  totp_verified: boolean;
  trusted_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  submission_quota_week: number;
  calls_count: number;
  rank_score: number;
  created_at: string;
  referred_by_user_id: string | null;
};
