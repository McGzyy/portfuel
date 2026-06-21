import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { discoveryDraftSchema, type DiscoveryDraftPayload } from "@/lib/desk-discovery/draft-types";
import { loadDiscoveryMarketContext } from "@/lib/desk-discovery/draft-context";
import { sanitizeDiscoveryDraft } from "@/lib/desk-discovery/level-sanity";
import { getDiscoveryCandidateById, updateDiscoveryCandidate } from "@/lib/desk-discovery/scanner";

const patchSchema = z
  .object({
    status: z.enum(["pending", "snoozed", "rejected", "approved"]),
    snoozeDays: z.number().int().min(1).max(90).optional(),
    draft: discoveryDraftSchema.optional(),
    clearDraft: z.boolean().optional(),
  })
  .refine((body) => body.status !== undefined || body.draft !== undefined || body.clearDraft, {
    message: "status_or_draft_required",
  });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const result = await getDiscoveryCandidateById(id);
    if (result.error) {
      const status =
        result.error === "not_found"
          ? 404
          : result.error === "migration_missing"
            ? 503
            : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ candidate: result.candidate });
  } catch (e) {
    return routeError(e);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());

    let snoozedUntil: string | null | undefined;
    if (body.status === "snoozed") {
      const days = body.snoozeDays ?? DISCOVERY_CONFIG.defaultSnoozeDays;
      const until = new Date();
      until.setDate(until.getDate() + days);
      snoozedUntil = until.toISOString();
    } else if (body.status !== undefined) {
      snoozedUntil = null;
    }

    let draftPayload: {
      draft?: DiscoveryDraftPayload | null;
      draftGeneratedAt?: string | null;
    } = {};
    if (body.clearDraft === true) {
      draftPayload = { draft: null, draftGeneratedAt: null };
    } else if (body.draft) {
      const lookup = await getDiscoveryCandidateById(id);
      let draft = body.draft;
      if (lookup.candidate) {
        const market = await loadDiscoveryMarketContext(
          lookup.candidate.symbol,
          lookup.candidate.assetClass
        );
        draft = sanitizeDiscoveryDraft(draft, market.lastPrice);
      }
      draftPayload = { draft, draftGeneratedAt: new Date().toISOString() };
    }

    const result = await updateDiscoveryCandidate(id, {
      ...(body.status !== undefined ? { status: body.status, snoozedUntil } : {}),
      ...draftPayload,
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
    return routeError(e);
  }
}

function routeError(e: unknown) {
  if (e instanceof Error && e.message === "unauthorized") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (e instanceof Error && e.message === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  console.error("[admin/desk-discovery PATCH]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
