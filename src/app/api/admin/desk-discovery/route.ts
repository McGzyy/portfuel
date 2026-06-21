import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { requireAdmin } from "@/lib/auth/session";
import {
  countActionableDiscoveryCandidates,
  countPendingDiscoveryCandidates,
  getDiscoveryCandidateById,
  getLastDiscoveryScanSummary,
  listDiscoveryCandidates,
  runDiscoveryScan,
} from "@/lib/desk-discovery/scanner";
import type { DiscoveryCandidateStatus } from "@/lib/desk-discovery/types";

const STATUS_PARAMS = [
  "pending",
  "approved",
  "published",
  "snoozed",
  "rejected",
  "inbox",
  "ready",
  "active",
] as const;

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const countOnly = url.searchParams.get("countOnly") === "1";
    if (countOnly) {
      const [pendingCount, actionableCount] = await Promise.all([
        countPendingDiscoveryCandidates(),
        countActionableDiscoveryCandidates(),
      ]);
      return NextResponse.json({ pendingCount, actionableCount });
    }

    const statusParam = url.searchParams.get("status");
    const status = STATUS_PARAMS.includes(statusParam as (typeof STATUS_PARAMS)[number])
      ? (statusParam as DiscoveryCandidateStatus | "active" | "inbox" | "ready")
      : "inbox";

    const [list, lastScan, pendingCount, actionableCount] = await Promise.all([
      listDiscoveryCandidates({ status }),
      getLastDiscoveryScanSummary(),
      countPendingDiscoveryCandidates(),
      countActionableDiscoveryCandidates(),
    ]);
    return NextResponse.json({
      candidates: list.candidates,
      lastScan,
      pendingCount,
      actionableCount,
      migrationMissing: list.migrationMissing ?? false,
      aiConfigured: isAiCoachConfigured(),
    });
  } catch (e) {
    return adminError(e);
  }
}

const scanSchema = z.object({
  action: z.literal("scan"),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    scanSchema.parse(await request.json());
    const result = await runDiscoveryScan();
    if ("error" in result) {
      const status = result.error === "migration_missing" ? 503 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    const list = await listDiscoveryCandidates({ status: "inbox" });
    return NextResponse.json({
      summary: result,
      candidates: list.candidates,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    return adminError(e);
  }
}

function adminError(e: unknown) {
  if (e instanceof Error && e.message === "unauthorized") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (e instanceof Error && e.message === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  console.error("[admin/desk-discovery]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
