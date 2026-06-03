import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { appPath } from "@/lib/social/app-url";
import {
  isReferralProgramEnabled,
  monthlyCapLabel,
  refereeDiscountLabel,
  referralRewardsCapPerMonth,
  referrerRewardCents,
  referrerRewardLabel,
} from "@/lib/referrals/config";
import { countReferrerRewardsThisMonth, grantReferrerRewardForConversion } from "@/lib/referrals/rewards";

export type ReferralStats = {
  referralCode: string;
  shareUrl: string;
  signedUp: number;
  converted: number;
  programEnabled: boolean;
  refereeOffer: string;
  referrerReward: string;
  monthlyCap: string;
  creditBalanceCents: number;
  rewardsThisMonth: number;
  rewardsCap: number;
};

export type ReferralHistoryRow = {
  id: string;
  kind: "referral" | "invite";
  label: string;
  status: string;
  createdAt: string;
  rewardCents: number | null;
  rewardStatus: string | null;
};

export type ReferrerPreview = {
  username: string;
  displayName: string;
};

function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function ensureReferralCode(userId: string, username: string): Promise<string> {
  const code = normalizeCode(username);
  const db = createServiceClient();
  const { data: row } = await db
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (row?.referral_code) return row.referral_code as string;

  const { error } = await db.from("users").update({ referral_code: code }).eq("id", userId);
  if (error) {
    console.error("[referrals/ensureReferralCode]", error);
  }
  return code;
}

export async function findReferrerByCode(code: string): Promise<{ id: string; username: string; display_name: string | null } | null> {
  const normalized = normalizeCode(code);
  if (!normalized || normalized.length < 2) return null;

  const db = createServiceClient();
  const { data: byCode } = await db
    .from("users")
    .select("id, username, display_name")
    .eq("referral_code", normalized)
    .maybeSingle();

  if (byCode) {
    return byCode as { id: string; username: string; display_name: string | null };
  }

  const { data: byUsername } = await db
    .from("users")
    .select("id, username, display_name")
    .ilike("username", normalized)
    .maybeSingle();

  return byUsername as { id: string; username: string; display_name: string | null } | null;
}

export async function previewReferrer(code: string): Promise<ReferrerPreview | null> {
  if (isDemoMode()) {
    const normalized = normalizeCode(code);
    if (normalized === "demo" || normalized === "admin") {
      return { username: normalized, displayName: normalized === "admin" ? "Admin" : "Demo Member" };
    }
    return null;
  }

  const referrer = await findReferrerByCode(code);
  if (!referrer) return null;
  return {
    username: referrer.username,
    displayName: referrer.display_name?.trim() || referrer.username,
  };
}

export async function attributeReferral(opts: {
  referrerId: string;
  referredUserId: string;
  referralCode: string;
}): Promise<void> {
  if (opts.referrerId === opts.referredUserId) return;

  const db = createServiceClient();
  const { error: userError } = await db
    .from("users")
    .update({ referred_by_user_id: opts.referrerId })
    .eq("id", opts.referredUserId);

  if (userError) {
    console.error("[referrals/attributeReferral] user update", userError);
    return;
  }

  const { error: refError } = await db.from("user_referrals").insert({
    referrer_id: opts.referrerId,
    referred_user_id: opts.referredUserId,
    referral_code: normalizeCode(opts.referralCode),
    status: "signed_up",
  } as never);

  if (refError && refError.code !== "23505") {
    console.error("[referrals/attributeReferral] insert", refError);
  }
}

export async function markReferralConverted(referredUserId: string): Promise<void> {
  const db = createServiceClient();
  const now = new Date().toISOString();

  const { error } = await db
    .from("user_referrals")
    .update({ status: "converted", converted_at: now })
    .eq("referred_user_id", referredUserId)
    .eq("status", "signed_up");

  if (error) {
    console.error("[referrals/markReferralConverted]", error);
    return;
  }

  await db
    .from("referral_invites")
    .update({ status: "converted" } as never)
    .eq("referred_user_id", referredUserId);

  await grantReferrerRewardForConversion(referredUserId);
}

export async function linkReferralInviteOnSignup(
  referredUserId: string,
  email: string | null | undefined
): Promise<void> {
  if (!email?.trim()) return;
  const db = createServiceClient();
  const normalized = email.trim().toLowerCase();
  await db
    .from("referral_invites")
    .update({
      status: "signed_up",
      referred_user_id: referredUserId,
    } as never)
    .eq("normalized_email", normalized)
    .eq("status", "sent");
}

function programMeta() {
  return {
    programEnabled: isReferralProgramEnabled(),
    refereeOffer: refereeDiscountLabel(),
    referrerReward: referrerRewardLabel(),
    monthlyCap: monthlyCapLabel(),
    rewardsCap: referralRewardsCapPerMonth(),
  };
}

export async function fetchReferralStats(userId: string, username: string): Promise<ReferralStats> {
  const meta = programMeta();

  if (isDemoMode()) {
    const code = normalizeCode(username);
    return {
      referralCode: code,
      shareUrl: appPath(`/join?ref=${encodeURIComponent(code)}`, {
        source: "referral",
        medium: "member",
        campaign: "invite",
      }),
      signedUp: 2,
      converted: 1,
      creditBalanceCents: 2500,
      rewardsThisMonth: 1,
      ...meta,
    };
  }

  const code = await ensureReferralCode(userId, username);
  const db = createServiceClient();

  const [{ data, error }, { data: userRow }, rewardsThisMonth] = await Promise.all([
    db.from("user_referrals").select("status").eq("referrer_id", userId),
    db.from("users").select("referral_credit_balance_cents").eq("id", userId).maybeSingle(),
    countReferrerRewardsThisMonth(userId),
  ]);

  if (error) {
    console.error("[referrals/fetchReferralStats]", error);
  }

  const rows = data ?? [];
  const signedUp = rows.length;
  const converted = rows.filter((r) => r.status === "converted").length;

  return {
    referralCode: code,
    shareUrl: appPath(`/join?ref=${encodeURIComponent(code)}`, {
      source: "referral",
      medium: "member",
      campaign: "invite",
    }),
    signedUp,
    converted,
    creditBalanceCents: Number(userRow?.referral_credit_balance_cents ?? 0),
    rewardsThisMonth,
    ...meta,
  };
}

export async function fetchReferralHistory(
  userId: string,
  limit = 30
): Promise<ReferralHistoryRow[]> {
  if (isDemoMode()) {
    return [
      {
        id: "demo-1",
        kind: "referral",
        label: "@friend1",
        status: "converted",
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        rewardCents: referrerRewardCents(),
        rewardStatus: "applied",
      },
      {
        id: "demo-2",
        kind: "invite",
        label: "pending@example.com",
        status: "sent",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        rewardCents: null,
        rewardStatus: null,
      },
    ];
  }

  const db = createServiceClient();

  const [{ data: referrals }, { data: invites }, { data: rewards }] = await Promise.all([
    db
      .from("user_referrals")
      .select("id, referral_code, status, created_at, converted_at, referred_user_id")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("referral_invites")
      .select("id, email, status, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("referral_rewards")
      .select("user_referral_id, amount_cents, status, role")
      .eq("referrer_id", userId)
      .eq("role", "referrer"),
  ]);

  const rewardByRef = new Map(
    (rewards ?? []).map((r) => [
      r.user_referral_id as string,
      {
        amountCents: r.amount_cents as number,
        status: r.status as string,
      },
    ])
  );

  const referredIds = (referrals ?? [])
    .map((r) => r.referred_user_id as string | null)
    .filter(Boolean) as string[];

  let userLabels = new Map<string, string>();
  if (referredIds.length > 0) {
    const { data: users } = await db
      .from("users")
      .select("id, username, display_name")
      .in("id", referredIds);
    for (const u of users ?? []) {
      const label = u.display_name?.trim() || `@${u.username}`;
      userLabels.set(u.id as string, label);
    }
  }

  const rows: ReferralHistoryRow[] = [];

  for (const r of referrals ?? []) {
    const reward = rewardByRef.get(r.id as string);
    rows.push({
      id: r.id as string,
      kind: "referral",
      label: userLabels.get(r.referred_user_id as string) ?? r.referral_code as string,
      status: r.status as string,
      createdAt: (r.converted_at ?? r.created_at) as string,
      rewardCents: reward?.amountCents ?? null,
      rewardStatus: reward?.status ?? null,
    });
  }

  for (const inv of invites ?? []) {
    rows.push({
      id: inv.id as string,
      kind: "invite",
      label: inv.email as string,
      status: inv.status as string,
      createdAt: inv.created_at as string,
      rewardCents: null,
      rewardStatus: null,
    });
  }

  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return rows.slice(0, limit);
}
