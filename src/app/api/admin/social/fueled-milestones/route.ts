import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { fetchFueledTrackRecord } from "@/lib/fueled/track-record";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { callMilestoneKeysForCall } from "@/lib/notifications/milestone-keys";
import { hasSocialPostBeenSent } from "@/lib/social/post-log";

export async function GET() {
  try {
    await requireAdmin();
    const record = await fetchFueledTrackRecord();

    let calls: {
      id: string;
      symbol: string;
      direction: string;
      return_pct: number | null;
      target_progress: number | null;
      entry_price: number | null;
      target_price: number | null;
      called_at: string;
    }[] = [];

    if (isDemoMode()) {
      calls = getDemoCallsFeed("latest")
        .filter((c) => c.is_fueled)
        .map((c) => ({
          id: c.id,
          symbol: c.symbol,
          direction: c.direction,
          return_pct: c.return_pct,
          target_progress: c.target_progress ?? null,
          entry_price: c.entry_price ?? null,
          target_price: c.target_price ?? null,
          called_at: c.called_at,
        }));
    } else {
      const db = createServiceClient();
      const { data, error } = await db
        .from("calls")
        .select(
          "id, symbol, direction, return_pct, target_progress, entry_price, target_price, called_at"
        )
        .eq("is_fueled", true)
        .order("called_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      calls = (data ?? []).map((c) => ({
        ...c,
        return_pct: c.return_pct != null ? Number(c.return_pct) : null,
        target_progress: c.target_progress != null ? Number(c.target_progress) : null,
        entry_price: c.entry_price != null ? Number(c.entry_price) : null,
        target_price: c.target_price != null ? Number(c.target_price) : null,
      }));
    }

    const items = [];
    for (const call of calls) {
      for (const milestone of callMilestoneKeysForCall(call)) {
        const refId = `milestone-${call.id}-${milestone}`;
        const posted = await hasSocialPostBeenSent("fueled_milestone", refId);
        items.push({
          callId: call.id,
          symbol: call.symbol,
          direction: call.direction,
          return_pct: call.return_pct,
          milestone,
          refId,
          posted,
          chartUrl: `/api/social/chart/${call.id}?milestone=${milestone}&format=png`,
        });
      }
    }

    const nextUnposted = items.find((item) => !item.posted) ?? null;

    return NextResponse.json({ record, milestones: items, nextUnposted });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/fueled-milestones]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
