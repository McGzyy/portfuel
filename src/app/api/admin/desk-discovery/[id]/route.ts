import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { updateDiscoveryCandidate } from "@/lib/desk-discovery/scanner";

const patchSchema = z.object({
  status: z.enum(["pending", "snoozed", "rejected", "approved"]),
  snoozeDays: z.number().int().min(1).max(90).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());

    let snoozedUntil: string | null = null;
    if (body.status === "snoozed") {
      const days = body.snoozeDays ?? DISCOVERY_CONFIG.defaultSnoozeDays;
      const until = new Date();
      until.setDate(until.getDate() + days);
      snoozedUntil = until.toISOString();
    }

    const result = await updateDiscoveryCandidate(id, {
      status: body.status,
      snoozedUntil,
    });

    if (result.error) {
      const status =
        result.error === "not_found"
          ? 404
          : result.error === "demo_readonly"
            ? 403
            : result.error === "migration_missing"
              ? 503
              : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ candidate: result.candidate });
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
    console.error("[admin/desk-discovery PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
