import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  dispatchWatchlistAlert,
  recordAlertSent,
  wasAlertSent,
} from "@/lib/alerts/dispatch";
import {
  normalizeWatchlistAlertPrefs,
  type WatchlistAlertPrefs,
} from "@/lib/alerts/preferences";
import { journalAlertHref } from "@/lib/journal/paths";
import { fetchEarningsForSymbols } from "@/lib/market/earnings-calendar";
import type { ProAccessContext } from "@/lib/features/pro-intelligence";
import type { MembershipTier } from "@/lib/stripe/config";
import { formatPct } from "@/lib/utils";

type PriceBand = "inside" | "outside_up" | "outside_down";
type LevelKind = "entry" | "stop" | "target";
type LevelSide = "above" | "below";

type WatchlistRow = {
  user_id: string;
  symbol: string;
  asset_class: string;
  baseline_price: number | null;
  thesis: string | null;
  conviction: number | null;
  entry_price: number | null;
  stop_price: number | null;
  target_price: number | null;
  membership_tier: MembershipTier | null;
  role: string;
  subscription_status: string | null;
  pro_granted_until: string | null;
  watchlist_alert_prefs: unknown;
};

function proContextFromRow(row: WatchlistRow): ProAccessContext {
  const status = row.subscription_status;
  const subscriptionStatus =
    status === "active" || status === "cancelled" || status === "pending"
      ? status
      : "pending";
  return {
    role: row.role === "admin" ? "admin" : "member",
    subscriptionStatus,
    membershipTier: row.membership_tier,
    proGrantedUntil: row.pro_granted_until,
  };
}

function priceBandForChange(pct: number, threshold: number): PriceBand {
  if (pct >= threshold) return "outside_up";
  if (pct <= -threshold) return "outside_down";
  return "inside";
}

function hysteresisResetPct(threshold: number): number {
  return Math.max(2, threshold - 1);
}

function isInsideBand(pct: number, threshold: number): boolean {
  const reset = hysteresisResetPct(threshold);
  return pct > -reset && pct < reset;
}

function sideVsLevel(price: number, level: number): LevelSide {
  return price >= level ? "above" : "below";
}

function shouldFirePlanCross(
  kind: LevelKind,
  prev: LevelSide | null,
  next: LevelSide
): boolean {
  if (!prev) return false;
  if (kind === "stop") return prev === "above" && next === "below";
  if (kind === "target") return prev === "below" && next === "above";
  return prev !== next;
}

function planLevelLabel(kind: LevelKind): string {
  if (kind === "entry") return "Entry";
  if (kind === "stop") return "Stop";
  return "Target";
}

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T12:00:00Z`).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / 86400000);
}

export type WatchlistAlertsCronResult = {
  scanned: number;
  priceAlerts: number;
  earningsAlerts: number;
  planAlerts: number;
};

export async function runWatchlistAlertsCron(): Promise<WatchlistAlertsCronResult> {
  if (isDemoMode()) {
    return { scanned: 0, priceAlerts: 0, earningsAlerts: 0, planAlerts: 0 };
  }

  const db = createServiceClient();
  const { data: rows, error } = await db
    .from("user_watchlist")
    .select(
      "user_id, symbol, asset_class, baseline_price, thesis, conviction, entry_price, stop_price, target_price"
    );

  if (error) {
    console.error("[alerts/cron/load]", error);
    throw error;
  }

  const watchRows = rows ?? [];
  const userIds = [...new Set(watchRows.map((r) => (r as { user_id: string }).user_id))];
  const userMap = new Map<
    string,
    {
      membership_tier: MembershipTier | null;
      role: string;
      subscription_status: string | null;
      pro_granted_until: string | null;
      watchlist_alert_prefs: unknown;
    }
  >();

  if (userIds.length > 0) {
    const { data: users } = await db
      .from("users")
      .select(
        "id, membership_tier, role, subscription_status, pro_granted_until, watchlist_alert_prefs"
      )
      .in("id", userIds)
      .in("subscription_status", ["active", "trialing"]);

    for (const u of users ?? []) {
      const row = u as {
        id: string;
        membership_tier: MembershipTier | null;
        role: string;
        subscription_status: string | null;
        pro_granted_until: string | null;
        watchlist_alert_prefs: unknown;
      };
      userMap.set(row.id, row);
    }
  }

  const entries: WatchlistRow[] = [];
  for (const r of watchRows) {
    const raw = r as {
      user_id: string;
      symbol: string;
      asset_class: string;
      baseline_price: number | null;
      thesis: string | null;
      conviction: number | null;
      entry_price: number | null;
      stop_price: number | null;
      target_price: number | null;
    };
    const user = userMap.get(raw.user_id);
    if (!user) continue;

    entries.push({
      user_id: raw.user_id,
      symbol: raw.symbol.toUpperCase(),
      asset_class: raw.asset_class,
      baseline_price: raw.baseline_price != null ? Number(raw.baseline_price) : null,
      thesis: raw.thesis ?? null,
      conviction: raw.conviction != null ? Number(raw.conviction) : null,
      entry_price: raw.entry_price != null ? Number(raw.entry_price) : null,
      stop_price: raw.stop_price != null ? Number(raw.stop_price) : null,
      target_price: raw.target_price != null ? Number(raw.target_price) : null,
      membership_tier: user.membership_tier,
      role: user.role,
      subscription_status: user.subscription_status,
      pro_granted_until: user.pro_granted_until,
      watchlist_alert_prefs: user.watchlist_alert_prefs,
    });
  }

  if (entries.length === 0) {
    return { scanned: 0, priceAlerts: 0, earningsAlerts: 0, planAlerts: 0 };
  }

  const symbols = [...new Set(entries.map((e) => e.symbol))];
  const { data: snaps } = await db
    .from("ticker_snapshots")
    .select("symbol, last_price")
    .in("symbol", symbols);

  const priceMap = new Map(
    (snaps ?? []).map((s) => [s.symbol as string, Number(s.last_price)])
  );

  const earningsBySymbol = new Map<string, { date: string; hour: string }[]>();
  const equitySymbols = symbols.filter((sym) =>
    entries.some((e) => e.symbol === sym && e.asset_class === "equity")
  );
  if (equitySymbols.length > 0) {
    const events = await fetchEarningsForSymbols(equitySymbols, 14);
    for (const ev of events) {
      const list = earningsBySymbol.get(ev.symbol) ?? [];
      list.push({ date: ev.date, hour: ev.hour });
      earningsBySymbol.set(ev.symbol, list);
    }
  }

  let priceAlerts = 0;
  let earningsAlerts = 0;
  let planAlerts = 0;

  for (const entry of entries) {
    const prefs = normalizeWatchlistAlertPrefs(entry.watchlist_alert_prefs);
    const last = priceMap.get(entry.symbol);
    const proContext = proContextFromRow(entry);
    const role = entry.role === "admin" ? "admin" : "member";
    const journalContext = {
      thesis: entry.thesis,
      conviction: entry.conviction,
      entryPrice: entry.entry_price,
      stopPrice: entry.stop_price,
      targetPrice: entry.target_price,
    };

    if (last != null && last > 0) {
      if (prefs.price_move && entry.baseline_price != null && entry.baseline_price > 0) {
        const pct = ((last - entry.baseline_price) / entry.baseline_price) * 100;
        const threshold = prefs.price_move_pct;
        const band = priceBandForChange(pct, threshold);

        const { data: bandRow } = await db
          .from("watchlist_price_band")
          .select("band")
          .eq("user_id", entry.user_id)
          .eq("symbol", entry.symbol)
          .maybeSingle();

        const prevBand = (bandRow as { band: PriceBand } | null)?.band ?? null;

        if (prevBand == null) {
          await db.from("watchlist_price_band").upsert(
            {
              user_id: entry.user_id,
              symbol: entry.symbol,
              band,
              updated_at: new Date().toISOString(),
            } as never,
            { onConflict: "user_id,symbol" }
          );
        } else if (prevBand === "inside" && band === "outside_up") {
          const refKey = `up_${threshold}pct`;
          if (!(await wasAlertSent({ userId: entry.user_id, alertKind: "price_move_up", refKey: `${entry.symbol}_${refKey}` }))) {
            const body = `Up ${formatPct(pct)} since you added it (threshold ±${threshold}%).`;
            await dispatchWatchlistAlert({
              userId: entry.user_id,
              type: "watchlist_price_move",
              title: `${entry.symbol} watchlist move`,
              body,
              href: journalAlertHref(entry.symbol, "price_move"),
              symbol: entry.symbol,
              membershipTier: entry.membership_tier,
              role,
              proContext,
              aiInsightsEnabled: prefs.ai_insights,
              journalContext,
              journalKind: "price_move",
            });
            await recordAlertSent({
              userId: entry.user_id,
              symbol: entry.symbol,
              alertKind: "price_move_up",
              refKey: `${entry.symbol}_${refKey}`,
            });
            priceAlerts++;
          }
          await db.from("watchlist_price_band").upsert(
            { user_id: entry.user_id, symbol: entry.symbol, band, updated_at: new Date().toISOString() } as never,
            { onConflict: "user_id,symbol" }
          );
        } else if (prevBand === "inside" && band === "outside_down") {
          const refKey = `down_${threshold}pct`;
          if (!(await wasAlertSent({ userId: entry.user_id, alertKind: "price_move_down", refKey: `${entry.symbol}_${refKey}` }))) {
            const body = `Down ${formatPct(pct)} since you added it (threshold ±${threshold}%).`;
            await dispatchWatchlistAlert({
              userId: entry.user_id,
              type: "watchlist_price_move",
              title: `${entry.symbol} watchlist move`,
              body,
              href: journalAlertHref(entry.symbol, "price_move"),
              symbol: entry.symbol,
              membershipTier: entry.membership_tier,
              role,
              proContext,
              aiInsightsEnabled: prefs.ai_insights,
              journalContext,
              journalKind: "price_move",
            });
            await recordAlertSent({
              userId: entry.user_id,
              symbol: entry.symbol,
              alertKind: "price_move_down",
              refKey: `${entry.symbol}_${refKey}`,
            });
            priceAlerts++;
          }
          await db.from("watchlist_price_band").upsert(
            { user_id: entry.user_id, symbol: entry.symbol, band, updated_at: new Date().toISOString() } as never,
            { onConflict: "user_id,symbol" }
          );
        } else if (
          (prevBand === "outside_up" || prevBand === "outside_down") &&
          isInsideBand(pct, threshold)
        ) {
          await db
            .from("watchlist_alert_sent")
            .delete()
            .eq("user_id", entry.user_id)
            .eq("symbol", entry.symbol)
            .in("alert_kind", ["price_move_up", "price_move_down"]);
          await db.from("watchlist_price_band").upsert(
            { user_id: entry.user_id, symbol: entry.symbol, band: "inside", updated_at: new Date().toISOString() } as never,
            { onConflict: "user_id,symbol" }
          );
        }
      }

      if (prefs.plan_levels) {
        const levels: { kind: LevelKind; value: number | null }[] = [
          { kind: "entry", value: entry.entry_price },
          { kind: "stop", value: entry.stop_price },
          { kind: "target", value: entry.target_price },
        ];

        for (const level of levels) {
          if (level.value == null || level.value <= 0) continue;

          const nextSide = sideVsLevel(last, level.value);
          const { data: stateRow } = await db
            .from("watchlist_level_state")
            .select("side")
            .eq("user_id", entry.user_id)
            .eq("symbol", entry.symbol)
            .eq("level_kind", level.kind)
            .maybeSingle();

          const prevSide = (stateRow as { side: LevelSide } | null)?.side ?? null;

          if (prevSide == null) {
            await db.from("watchlist_level_state").upsert(
              {
                user_id: entry.user_id,
                symbol: entry.symbol,
                level_kind: level.kind,
                side: nextSide,
                updated_at: new Date().toISOString(),
              } as never,
              { onConflict: "user_id,symbol,level_kind" }
            );
            continue;
          }

          if (shouldFirePlanCross(level.kind, prevSide, nextSide)) {
            const refKey = `${entry.symbol}_${level.kind}_${level.value}`;
            if (!(await wasAlertSent({ userId: entry.user_id, alertKind: `plan_${level.kind}`, refKey }))) {
              const label = planLevelLabel(level.kind);
              const body = `${label} ${level.value} — price now ${last.toFixed(2)}.`;
              await dispatchWatchlistAlert({
                userId: entry.user_id,
                type: "watchlist_plan_level",
                title: `${entry.symbol} plan level`,
                body,
                href: journalAlertHref(entry.symbol, "plan_level"),
                symbol: entry.symbol,
                membershipTier: entry.membership_tier,
                role,
                proContext,
                aiInsightsEnabled: prefs.ai_insights,
                journalContext,
                journalKind: "plan_level",
              });
              await recordAlertSent({
                userId: entry.user_id,
                symbol: entry.symbol,
                alertKind: `plan_${level.kind}`,
                refKey,
              });
              planAlerts++;
            }
          }

          await db.from("watchlist_level_state").upsert(
            {
              user_id: entry.user_id,
              symbol: entry.symbol,
              level_kind: level.kind,
              side: nextSide,
              updated_at: new Date().toISOString(),
            } as never,
            { onConflict: "user_id,symbol,level_kind" }
          );
        }
      }
    }

    if (prefs.earnings && entry.asset_class === "equity") {
      const events = earningsBySymbol.get(entry.symbol) ?? [];
      for (const ev of events) {
        const days = daysUntil(ev.date);
        if (days < 0 || days > prefs.earnings_days_ahead) continue;

        const refKey = `${entry.symbol}_${ev.date}`;
        if (await wasAlertSent({ userId: entry.user_id, alertKind: "earnings", refKey })) continue;

        const when =
          days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
        const hour = ev.hour ? ` (${ev.hour.toUpperCase()})` : "";
        const body = `Reports ${when}${hour}. Check your journal plan before the print.`;

        await dispatchWatchlistAlert({
          userId: entry.user_id,
          type: "watchlist_earnings",
          title: `${entry.symbol} earnings ${ev.date}`,
          body,
          href: journalAlertHref(entry.symbol, "earnings"),
          symbol: entry.symbol,
          membershipTier: entry.membership_tier,
          role,
          proContext,
          aiInsightsEnabled: prefs.ai_insights,
          journalContext,
          journalKind: "earnings",
        });
        await recordAlertSent({
          userId: entry.user_id,
          symbol: entry.symbol,
          alertKind: "earnings",
          refKey,
        });
        earningsAlerts++;
      }
    }
  }

  return {
    scanned: entries.length,
    priceAlerts,
    earningsAlerts,
    planAlerts,
  };
}
