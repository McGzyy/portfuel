import { createServiceClient } from "@/lib/db/supabase";
import { sendPortfuelEmail } from "@/lib/email/client";
import { isEmailConfigured, getAppUrl } from "@/lib/email/config";
import { adminChurnFeedbackEmail } from "@/lib/email/templates";
import type {
  CancellationFeedbackReason,
  CancellationFeedbackRow,
  CancellationFeedbackSource,
  CancellationFeedbackWithUser,
} from "@/lib/billing/cancellation-feedback-types";
import { cancellationReasonLabel } from "@/lib/billing/cancellation-feedback-types";
import type { BillingInterval, MembershipTier } from "@/lib/stripe/config";

export type SubmitCancellationFeedbackInput = {
  userId: string;
  reason: CancellationFeedbackReason;
  comment?: string | null;
  source?: CancellationFeedbackSource;
};

async function fetchAdminNotifyEmails(): Promise<string[]> {
  const fromEnv =
    process.env.ADMIN_NOTIFY_EMAIL?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const db = createServiceClient();
  const { data } = await db.from("users").select("email").eq("role", "admin");
  const adminEmails = (data ?? [])
    .map((row) => row.email?.trim())
    .filter((email): email is string => Boolean(email));

  return [...new Set([...fromEnv, ...adminEmails])];
}

async function notifyAdminsInApp(opts: {
  title: string;
  body: string;
}): Promise<void> {
  const db = createServiceClient();
  const { data: admins } = await db.from("users").select("id").eq("role", "admin");
  if (!admins?.length) return;

  const rows = admins.map((admin) => ({
    user_id: admin.id,
    type: "admin_churn_feedback",
    title: opts.title,
    body: opts.body,
    href: "/admin?tab=churn",
  }));

  const { error } = await db.from("user_notifications").insert(rows as never);
  if (error) console.error("[churn-feedback/in-app]", error);
}

async function notifyAdminsByEmail(feedback: CancellationFeedbackWithUser): Promise<void> {
  if (!isEmailConfigured()) return;

  const recipients = await fetchAdminNotifyEmails();
  if (!recipients.length) return;

  const tpl = adminChurnFeedbackEmail({
    username: feedback.username,
    displayName: feedback.display_name,
    reason: cancellationReasonLabel(feedback.reason),
    comment: feedback.comment,
    tier: feedback.membership_tier,
    subscriptionStatus: feedback.subscription_status,
  });

  await Promise.all(
    recipients.map((to) =>
      sendPortfuelEmail({
        to,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      })
    )
  );
}

async function fetchFeedbackWithUser(id: string): Promise<CancellationFeedbackWithUser | null> {
  const db = createServiceClient();
  const { data: row, error } = await db
    .from("subscription_cancellation_feedback")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error("[churn-feedback/fetch]", error);
    return null;
  }

  const feedback = row as CancellationFeedbackRow;
  const { data: user } = await db
    .from("users")
    .select("username, display_name, email")
    .eq("id", feedback.user_id)
    .maybeSingle();

  return {
    ...feedback,
    username: user?.username ?? "unknown",
    display_name: user?.display_name ?? null,
    email: user?.email ?? null,
  };
}

export async function submitCancellationFeedback(
  input: SubmitCancellationFeedbackInput
): Promise<{ id: string }> {
  const db = createServiceClient();
  const { data: user, error: userErr } = await db
    .from("users")
    .select(
      "subscription_status, membership_tier, billing_interval, stripe_subscription_id"
    )
    .eq("id", input.userId)
    .maybeSingle();

  if (userErr || !user) throw new Error("user_not_found");

  const comment = input.comment?.trim() || null;

  const { data: inserted, error } = await db
    .from("subscription_cancellation_feedback")
    .insert({
      user_id: input.userId,
      reason: input.reason,
      comment,
      membership_tier: user.membership_tier as MembershipTier | null,
      billing_interval: user.billing_interval as BillingInterval | null,
      subscription_status: user.subscription_status,
      source: input.source ?? "pre_portal",
    } as never)
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("[churn-feedback/insert]", error);
    throw new Error("insert_failed");
  }

  const feedback = await fetchFeedbackWithUser(inserted.id);
  if (feedback) {
    const memberLabel = feedback.display_name?.trim() || feedback.username;
    const reasonLabel = cancellationReasonLabel(feedback.reason);
    const title = "Subscription cancellation feedback";
    const body = `${memberLabel} (${feedback.username}): ${reasonLabel}${
      feedback.comment ? ` — "${feedback.comment.slice(0, 120)}"` : ""
    }`;

    await notifyAdminsInApp({ title, body });
    await notifyAdminsByEmail(feedback).catch((e) =>
      console.error("[churn-feedback/email]", e)
    );

    await db
      .from("subscription_cancellation_feedback")
      .update({ admin_notified_at: new Date().toISOString() } as never)
      .eq("id", inserted.id);
  }

  return { id: inserted.id };
}

export async function listCancellationFeedbackAdmin(
  limit = 100
): Promise<CancellationFeedbackWithUser[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("subscription_cancellation_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const rows = (data ?? []) as CancellationFeedbackRow[];
  if (!rows.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: users } = await db
    .from("users")
    .select("id, username, display_name, email")
    .in("id", userIds);

  const userMap = new Map(
    (users ?? []).map((u) => [
      u.id,
      {
        username: u.username as string,
        display_name: u.display_name as string | null,
        email: u.email as string | null,
      },
    ])
  );

  return rows.map((row) => {
    const user = userMap.get(row.user_id);
    return {
      ...row,
      username: user?.username ?? "unknown",
      display_name: user?.display_name ?? null,
      email: user?.email ?? null,
    };
  });
}

export async function userHasRecentCancellationFeedback(
  userId: string,
  withinHours = 24
): Promise<boolean> {
  const db = createServiceClient();
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
  const { count, error } = await db
    .from("subscription_cancellation_feedback")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    console.error("[churn-feedback/recent]", error);
    return false;
  }
  return (count ?? 0) > 0;
}

export function adminChurnPanelUrl(): string {
  return `${getAppUrl()}/admin?tab=churn`;
}
