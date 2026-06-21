import { createServiceClient } from "@/lib/db/supabase";
import { sendPortfuelEmail } from "@/lib/email/client";
import { getAppUrl, isEmailConfigured } from "@/lib/email/config";
import { isDemoMode } from "@/lib/demo/config";
import { isMissingDiscoveryTable } from "@/lib/desk-discovery/db-errors";
import type { ScoredDiscoveryCandidate } from "@/lib/desk-discovery/types";

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

export async function notifyAdminsDiscoveryCandidates(
  candidates: ScoredDiscoveryCandidate[],
  minScore: number
): Promise<number> {
  if (isDemoMode() || candidates.length === 0) return 0;

  const highScore = candidates.filter((c) => c.score >= minScore);
  if (highScore.length === 0) return 0;

  try {
    const db = createServiceClient();
    const symbols = highScore.map((c) => c.symbol);
    const { data: existing, error: fetchError } = await db
      .from("desk_signal_candidates")
      .select("id, symbol, status, admin_notified_at")
      .in("symbol", symbols);

    if (fetchError) {
      if (isMissingDiscoveryTable(fetchError.message)) return 0;
      console.error("[desk-discovery/notify]", fetchError.message);
      return 0;
    }

    const toNotify = highScore.filter((c) => {
      const row = (existing ?? []).find(
        (r) => (r as { symbol?: string }).symbol?.toUpperCase() === c.symbol
      ) as { status?: string; admin_notified_at?: string | null } | undefined;
      if (!row) return true;
      if (row.status !== "pending") return false;
      return !row.admin_notified_at;
    });

    if (toNotify.length === 0) return 0;

    const { data: admins } = await db.from("users").select("id").eq("role", "admin");
    if (!admins?.length) return 0;

    const top = toNotify.slice(0, 5);
    const title =
      top.length === 1
        ? `Discovery: ${top[0]!.symbol} (score ${top[0]!.score})`
        : `Discovery: ${top.length} high-score setups`;
    const body = top
      .map((c) => `${c.symbol} · ${c.score} · ${c.headline.slice(0, 80)}`)
      .join(" · ");
    const href = "/admin?tab=discovery";

    const rows = admins.map((admin) => ({
      user_id: admin.id,
      type: "admin_desk_discovery",
      title,
      body,
      href,
    }));

    const { error: insertError } = await db.from("user_notifications").insert(rows as never);
    if (insertError) {
      console.error("[desk-discovery/notify]", insertError.message);
      return 0;
    }

    const now = new Date().toISOString();
    for (const c of toNotify) {
      await db
        .from("desk_signal_candidates")
        .update({ admin_notified_at: now, updated_at: now } as never)
        .eq("symbol", c.symbol);
    }

    if (isEmailConfigured()) {
      const recipients = await fetchAdminNotifyEmails();
      if (recipients.length) {
        const url = `${getAppUrl()}${href}`;
        await Promise.all(
          recipients.map((to) =>
            sendPortfuelEmail({
              to,
              subject: `[PortFuel] ${title}`,
              html: `<p>${body}</p><p><a href="${url}">Open discovery inbox</a></p>`,
              text: `${body}\n\nOpen: ${url}`,
            })
          )
        ).catch((e) => console.error("[desk-discovery/notify-email]", e));
      }
    }

    return toNotify.length;
  } catch (e) {
    console.error("[desk-discovery/notify]", e);
    return 0;
  }
}
