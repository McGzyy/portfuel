import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  countActionableDiscoveryCandidates,
  countPendingDiscoveryCandidates,
} from "@/lib/desk-discovery/scanner";
import { countAdminSupportAttentionTickets } from "@/lib/support/tickets";

export async function GET() {
  try {
    await requireAdmin();
    const [pendingCount, actionableCount, supportAttention] = await Promise.all([
      countPendingDiscoveryCandidates(),
      countActionableDiscoveryCandidates(),
      countAdminSupportAttentionTickets(),
    ]);

    return NextResponse.json({
      discoveryPending: pendingCount,
      discoveryActionable: actionableCount,
      supportAttention,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/nav-counts GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
