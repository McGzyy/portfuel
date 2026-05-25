import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { loadFeedCalls, mapCallForCard } from "@/lib/dashboard/data";
import type { CallCardData } from "@/components/calls/CallCard";

export type DeskBrief = {
  weeklyNote: string | null;
  pinnedCall: CallCardData | null;
  updatedAt: string | null;
};

export type DeskBriefAdmin = DeskBrief & {
  pinnedCallId: string | null;
  fueledCalls: { id: string; symbol: string; direction: string; called_at: string }[];
};

const BRIEF_ID = "default";

export async function fetchDeskBrief(): Promise<DeskBrief> {
  if (isDemoMode()) {
    const latest = await loadFeedCalls("latest");
    const fueled = latest.filter((c) => c.is_fueled);
    const pinned = fueled[0] ? mapCallForCard(fueled[0]) : null;
    return {
      weeklyNote:
        "Desk focus this week: quality over quantity. We're tracking mega-cap AI leaders and selective crypto beta — full theses below.",
      pinnedCall: pinned,
      updatedAt: new Date().toISOString(),
    };
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("desk_brief")
    .select("weekly_note, pinned_call_id, updated_at")
    .eq("id", BRIEF_ID)
    .maybeSingle();

  if (error || !data) {
    return { weeklyNote: null, pinnedCall: null, updatedAt: null };
  }

  const row = data as {
    weekly_note: string | null;
    pinned_call_id: string | null;
    updated_at: string;
  };

  let pinnedCall: CallCardData | null = null;
  if (row.pinned_call_id) {
    const { data: call } = await db
      .from("calls")
      .select("*, users!inner(id, pin, username, display_name, trusted_at, rank_score)")
      .eq("id", row.pinned_call_id)
      .eq("is_fueled", true)
      .maybeSingle();

    if (call) {
      pinnedCall = mapCallForCard(call as never);
    }
  }

  return {
    weeklyNote: row.weekly_note,
    pinnedCall,
    updatedAt: row.updated_at,
  };
}

export async function fetchDeskBriefForAdmin(): Promise<DeskBriefAdmin> {
  const brief = await fetchDeskBrief();
  const db = createServiceClient();

  if (isDemoMode()) {
    const latest = await loadFeedCalls("latest");
    return {
      ...brief,
      pinnedCallId: brief.pinnedCall?.id ?? null,
      fueledCalls: latest
        .filter((c) => c.is_fueled)
        .slice(0, 20)
        .map((c) => ({
          id: c.id,
          symbol: c.symbol,
          direction: c.direction,
          called_at: c.called_at,
        })),
    };
  }

  const { data: row } = await db
    .from("desk_brief")
    .select("pinned_call_id")
    .eq("id", BRIEF_ID)
    .maybeSingle();

  const { data: fueled } = await db
    .from("calls")
    .select("id, symbol, direction, called_at")
    .eq("is_fueled", true)
    .order("called_at", { ascending: false })
    .limit(30);

  return {
    ...brief,
    pinnedCallId: (row as { pinned_call_id: string | null } | null)?.pinned_call_id ?? null,
    fueledCalls: (fueled ?? []) as {
      id: string;
      symbol: string;
      direction: string;
      called_at: string;
    }[],
  };
}

export async function updateDeskBrief(input: {
  weeklyNote?: string | null;
  pinnedCallId?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.weeklyNote !== undefined) {
    update.weekly_note = input.weeklyNote?.trim() || null;
  }
  if (input.pinnedCallId !== undefined) {
    if (input.pinnedCallId) {
      const { data: call } = await db
        .from("calls")
        .select("id")
        .eq("id", input.pinnedCallId)
        .eq("is_fueled", true)
        .maybeSingle();
      if (!call) return { error: "invalid_call" };
    }
    update.pinned_call_id = input.pinnedCallId || null;
  }

  const { error } = await db.from("desk_brief").update(update as never).eq("id", BRIEF_ID);

  if (error) {
    console.error("[desk/brief/update]", error);
    return { error: "db_error" };
  }
  return { ok: true };
}
