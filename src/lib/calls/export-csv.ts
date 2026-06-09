import { isOpenMemberCall } from "@/lib/calls/open-calls";
import type { UserCallRow } from "@/lib/calls/call-fields";
import { isCallClosed, isCallWin } from "@/lib/scoring/call-credit";
import { getAppOrigin } from "@/lib/social/app-url";

const EXPORT_COLUMNS = [
  "called_at",
  "symbol",
  "asset_class",
  "direction",
  "status",
  "outcome",
  "entry_price",
  "price_at_call",
  "target_price",
  "stop_price",
  "exit_price",
  "last_price",
  "return_pct",
  "peak_return_pct",
  "target_progress",
  "closed_at",
  "timeframe_tag",
  "vote_score",
  "comment_count",
  "is_fueled",
  "call_id",
  "public_url",
  "thesis",
] as const;

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  const raw = String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function formatNum(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return String(value);
}

function callStatus(call: UserCallRow): "open" | "closed" {
  if (isCallClosed(call)) return "closed";
  return isOpenMemberCall(call) ? "open" : "closed";
}

function callOutcome(call: UserCallRow): string {
  if (isOpenMemberCall(call) && !isCallClosed(call)) return "open";
  if (call.return_pct == null) return "pending";
  if (isCallWin(call)) return "win";
  if ((call.return_pct ?? 0) < 0) return "loss";
  return "flat";
}

function rowToCells(call: UserCallRow, username: string): string[] {
  const origin = getAppOrigin();
  const publicUrl = `${origin}/member/${encodeURIComponent(username)}#call-${call.id}`;

  return [
    call.called_at,
    call.symbol.toUpperCase(),
    call.asset_class ?? "equity",
    call.direction,
    callStatus(call),
    callOutcome(call),
    formatNum(call.entry_price),
    formatNum(call.price_at_call),
    formatNum(call.target_price),
    formatNum(call.stop_price),
    formatNum(call.exit_price ?? null),
    formatNum(call.last_price),
    formatNum(call.return_pct),
    formatNum(call.peak_return_pct ?? null),
    formatNum(call.target_progress),
    call.closed_at ?? "",
    call.timeframe_tag ?? "",
    String(call.vote_score),
    String(call.comment_count),
    call.is_fueled ? "true" : "false",
    call.id,
    publicUrl,
    call.thesis.trim(),
  ].map(escapeCsvCell);
}

export function buildCallsExportCsv(calls: UserCallRow[], username: string): string {
  const header = EXPORT_COLUMNS.join(",");
  const rows = calls.map((call) => rowToCells(call, username).join(","));
  return [header, ...rows].join("\r\n");
}

export function callsExportFilename(username: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = username.replace(/[^a-zA-Z0-9_-]/g, "");
  return `portfuel-track-record-${safe || "member"}-${date}.csv`;
}
