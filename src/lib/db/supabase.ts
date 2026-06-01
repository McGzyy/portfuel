import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          pin: string;
          username: string;
          password_hash: string | null;
          display_name: string | null;
          email: string | null;
          totp_secret_enc: string | null;
          totp_verified: boolean;
          role: "member" | "admin";
          subscription_status: "pending" | "active" | "cancelled";
          trusted_at: string | null;
          calls_count: number;
          win_rate: number | null;
          avg_return_pct: number | null;
          rank_score: number;
          submission_quota_week: number;
          membership_tier: "member" | "pro" | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          notify_email: string | null;
          email_instant_enabled: boolean;
          email_digest_enabled: boolean;
          email_digest_last_sent_at: string | null;
          onboarding_completed_at: string | null;
          referral_code: string | null;
          referred_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          pin: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      calls: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          asset_class: "equity" | "crypto";
          direction: "long" | "short";
          thesis: string;
          entry_price: number | null;
          target_price: number | null;
          stop_price: number | null;
          timeframe_tag: string | null;
          called_at: string;
          price_at_call: number | null;
          last_price: number | null;
          return_pct: number | null;
          target_progress: number | null;
          score_points: number;
          vote_score: number;
          comment_count: number;
          is_fueled: boolean;
          source: string;
          source_tweet_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["calls"]["Row"]> & {
          user_id: string;
          symbol: string;
          direction: "long" | "short";
          thesis: string;
        };
        Update: Partial<Database["public"]["Tables"]["calls"]["Row"]>;
      };
      user_referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_user_id: string;
          referral_code: string;
          status: "signed_up" | "converted";
          converted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_referrals"]["Row"]> & {
          referrer_id: string;
          referred_user_id: string;
          referral_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_referrals"]["Row"]>;
      };
      ticker_snapshots: {
        Row: {
          symbol: string;
          company_name: string | null;
          last_price: number | null;
          prev_close: number | null;
          updated_at: string;
        };
      };
      hype_scores: {
        Row: {
          symbol: string;
          score: number;
          components: Record<string, unknown>;
          updated_at: string;
        };
      };
    };
    Views: {
      teaser_latest_calls: { Row: TeaserCallRow };
      teaser_performing_calls: { Row: TeaserCallRow };
      teaser_all_time_calls: { Row: TeaserCallRow };
    };
  };
};

export type TeaserCallRow = {
  id: string;
  symbol: string;
  asset_class: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  return_pct: number | null;
  target_progress: number | null;
  is_fueled: boolean;
  vote_score: number;
  comment_count: number;
  display_name: string | null;
  pin: string;
  is_trusted: boolean;
};

export type CallWithUser = Database["public"]["Tables"]["calls"]["Row"] & {
  users: Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "id" | "pin" | "username" | "display_name" | "trusted_at" | "rank_score"
  >;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function createServiceClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export function createAnonClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return Boolean(
    url &&
      !url.includes("your-project.supabase.co") &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
