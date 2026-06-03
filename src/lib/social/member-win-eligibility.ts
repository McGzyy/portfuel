import { getMemberWinGateConfig } from "@/lib/social/member-win-config";

export type MemberWinCallSnapshot = {
  return_pct: number | null;
  called_at: string;
  is_fueled: boolean;
};

export type MemberWinEligibilityReason =
  | "fueled_desk"
  | "no_return"
  | "too_fresh"
  | "below_return"
  | "meets_normal"
  | "meets_fast_track";

export function callAgeHours(calledAt: string, nowMs = Date.now()): number {
  return (nowMs - new Date(calledAt).getTime()) / 3_600_000;
}

/** Return + age rules satisfied (first step before sustain timer). */
export function meetsMemberWinReturnAgeGate(
  call: MemberWinCallSnapshot,
  nowMs = Date.now()
): { ok: boolean; reason: MemberWinEligibilityReason } {
  if (call.is_fueled) return { ok: false, reason: "fueled_desk" };

  const ret = call.return_pct;
  if (ret == null) return { ok: false, reason: "no_return" };

  const cfg = getMemberWinGateConfig();
  const ageH = callAgeHours(call.called_at, nowMs);

  if (ret >= cfg.fastTrackReturnPct && ageH >= cfg.fastTrackMinAgeHours) {
    return { ok: true, reason: "meets_fast_track" };
  }

  if (ret >= cfg.minReturnPct && ageH >= cfg.minAgeHours) {
    return { ok: true, reason: "meets_normal" };
  }

  if (ret >= cfg.minReturnPct || ret >= cfg.fastTrackReturnPct) {
    return { ok: false, reason: "too_fresh" };
  }

  return { ok: false, reason: "below_return" };
}

/** Gate recorded and sustain window elapsed — safe to post. */
export function isMemberWinReadyToPost(opts: {
  call: MemberWinCallSnapshot;
  gateRecordedAt: string | null;
  nowMs?: number;
}): boolean {
  const gate = meetsMemberWinReturnAgeGate(opts.call, opts.nowMs);
  if (!gate.ok) return false;
  if (!opts.gateRecordedAt) return false;

  const cfg = getMemberWinGateConfig();
  const sustainMs = cfg.sustainHours * 3_600_000;
  const elapsed = (opts.nowMs ?? Date.now()) - new Date(opts.gateRecordedAt).getTime();
  return elapsed >= sustainMs;
}

export function describeMemberWinRules(): string {
  const c = getMemberWinGateConfig();
  return (
    `Featured on @PortFuel after +${c.minReturnPct}% with ${c.minAgeHours}h on record ` +
    `(or +${c.fastTrackReturnPct}% after ${c.fastTrackMinAgeHours}h), then a ${c.sustainHours}h review window before publish. ` +
    `Early or unproven calls are never shared.`
  );
}
