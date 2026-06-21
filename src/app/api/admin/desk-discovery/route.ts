import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  countPendingDiscoveryCandidates,
  getLastDiscoveryScanSummary,
  listDiscoveryCandidates,
  runDiscoveryScan,
} from "@/lib/desk-discovery/scanner";
import type { DiscoveryCandidateStatus } from "@/lib/desk-discovery/types";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const countOnly = url.searchParams.get("countOnly") === "1";
    if (countOnly) {
      const pendingCount = await countPendingDiscoveryCandidates();
      return NextResponse.json({ pendingCount });
    }

    const statusParam = url.searchParams.get("status");
    const status =
      statusParam === "pending" ||
      statusParam === "approved" ||
      statusParam === "published" ||
      statusParam === "inbox" ||
      statusParam === "active"
        ? (statusParam as DiscoveryCandidateStatus | "active" | "inbox")
        : "inbox";

    const [list, lastScan, pendingCount] = await Promise.all([
      listDiscoveryCandidates({ status }),
      getLastDiscoveryScanSummary(),
      countPendingDiscoveryCandidates(),
    ]);
    return NextResponse.json({
      candidates: list.candidates,
      lastScan,
      pendingCount,
      migrationMissing: list.migrationMissing ?? false,
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
