import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { generateDiscoveryDraft } from "@/lib/desk-discovery/draft";
import { listDiscoveryCandidates } from "@/lib/desk-discovery/scanner";
import type { DiscoveryReason } from "@/lib/desk-discovery/types";

const draftSchema = z.object({
  direction: z.enum(["long", "short"]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = draftSchema.parse(await request.json().catch(() => ({})));

    const { candidates } = await listDiscoveryCandidates({ status: "active", limit: 100 });
    const row = candidates.find((c) => c.id === id);
    if (!row) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const result = await generateDiscoveryDraft({
      symbol: row.symbol,
      assetClass: row.assetClass,
      reasons: row.reasons as DiscoveryReason[],
      direction: body.direction,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ text: result.text });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/desk-discovery draft]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
