import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { canGenerateSummary } from "@/lib/ai/config";
import {
  getOrCreateThesisSummary,
  loadCallForSummary,
} from "@/lib/ai/summary";
import { fetchAiSummaryUsage } from "@/lib/ai/summary-usage";

const bodySchema = z.object({
  callId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const { callId } = bodySchema.parse(await request.json());

    const ctx = await loadCallForSummary(callId);
    if (!ctx) {
      return NextResponse.json({ error: "call_not_found" }, { status: 404 });
    }

    const allowGenerate = canGenerateSummary(
      session.membershipTier ?? null,
      session.role
    );

    const usage = await fetchAiSummaryUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      canGenerate: allowGenerate,
    });

    if (allowGenerate && usage.remaining <= 0) {
      const cachedOnly = await getOrCreateThesisSummary({
        userId: session.userId,
        ctx,
        allowGenerate: false,
      });
      if ("summaryLine" in cachedOnly) {
        return NextResponse.json({
          ...cachedOnly,
          usage: { ...usage, remaining: 0 },
        });
      }
      return NextResponse.json(
        { error: "quota_exceeded", usage },
        { status: 429 }
      );
    }

    const result = await getOrCreateThesisSummary({
      userId: session.userId,
      ctx,
      allowGenerate,
    });

    if ("error" in result) {
      if (result.error === "not_cached") {
        return NextResponse.json(
          {
            error: "pro_required",
            message:
              "No summary yet. Pro members can generate quick reads; summaries are then visible to everyone.",
          },
          { status: 403 }
        );
      }
      if (result.error === "ai_unavailable") {
        return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const usageAfter = allowGenerate
      ? await fetchAiSummaryUsage({
          userId: session.userId,
          membershipTier: session.membershipTier ?? null,
          role: session.role,
          canGenerate: true,
        })
      : usage;

    return NextResponse.json({
      ...result,
      usage: usageAfter,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "totp_required") {
      return NextResponse.json({ error: "totp_required" }, { status: 403 });
    }
    console.error("[ai/thesis-summary POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
