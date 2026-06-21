import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  generateAndSaveDiscoveryDraft,
  getDiscoveryCandidateById,
} from "@/lib/desk-discovery/scanner";

const draftSchema = z.object({
  direction: z.enum(["long", "short"]).optional(),
  autoApprove: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = draftSchema.parse(await request.json().catch(() => ({})));

    const lookup = await getDiscoveryCandidateById(id);
    if (lookup.error || !lookup.candidate) {
      const status =
        lookup.error === "not_found"
          ? 404
          : lookup.error === "migration_missing"
            ? 503
            : 500;
      return NextResponse.json({ error: lookup.error ?? "not_found" }, { status });
    }

    const row = lookup.candidate;
    if (row.status === "published") {
      return NextResponse.json({ error: "already_published" }, { status: 400 });
    }

    const result = await generateAndSaveDiscoveryDraft(row, {
      autoApprove: body.autoApprove ?? true,
      direction: body.direction,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const candidate = result.candidate!;
    return NextResponse.json({
      candidate,
      draft: candidate.draft,
      text: candidate.draft?.thesis ?? "",
    });
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
